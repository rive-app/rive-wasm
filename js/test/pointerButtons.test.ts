import * as rive from "../src/rive";
import { loadFile } from "./helpers";
import { testWith } from "./buildFeatures";

// DOM MouseEvent.button values.
const LEFT = 0;
const MIDDLE = 1;
const RIGHT = 2;
const BACK = 3;

let instances: rive.Rive[] = [];

afterEach(() => {
  instances.forEach((r) => r.cleanup());
  instances = [];
});

/** A canvas whose bounds report `rect`, read when each event lands. */
function sizedCanvas(rect: { width: number; height: number }) {
  const canvas = document.createElement("canvas");
  jest.spyOn(canvas, "getBoundingClientRect").mockImplementation(() => ({
    left: 0,
    top: 0,
    right: rect.width,
    bottom: rect.height,
    width: rect.width,
    height: rect.height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));
  return canvas;
}

function load(
  file: string,
  stateMachine: string,
  rect = { width: 200, height: 200 },
  artboard?: string,
): Promise<rive.Rive> {
  return new Promise((resolve) => {
    const r: rive.Rive = new rive.Rive({
      canvas: sizedCanvas(rect),
      buffer: loadFile(file),
      artboard,
      stateMachines: stateMachine,
      layout: new rive.Layout({ fit: rive.Fit.Fill }),
      autoplay: true,
      onLoad: () => {
        instances.push(r);
        // Pointer listeners are attached just after load.
        setTimeout(() => {
          smInstance(r).advanceAndApply(0);
          resolve(r);
        }, 0);
      },
    });
  });
}

/**
 * Loads the pad (x 0..200): a down listener per button, up listeners for
 * primary and secondary and a primary click listener. Beside it, "Plain"
 * (x 200..300) has only a primary click listener.
 */
const loadPad = () =>
  load("assets/pointer_buttons/pointer_buttons.riv", "Main", { width: 300, height: 200 });

/** Client x of "Plain", which has only a primary click listener. */
const PLAIN_X = 250;

/** The first playing state machine's low-level instance. */
const smInstance = (r: rive.Rive) => (r as any).animator.stateMachines[0].instance;

/** Every bool input of the first playing state machine, by name. */
function bools(r: rive.Rive): Record<string, boolean> {
  const smi = smInstance(r);
  const values: Record<string, boolean> = {};
  for (let i = 0; i < smi.inputCount(); i++) {
    const input = smi.input(i);
    values[input.name] = input.asBool().value as boolean;
  }
  return values;
}

function mouse(r: rive.Rive, type: string, button: number, x = 100, y = 100) {
  const event = new MouseEvent(type, {
    clientX: x,
    clientY: y,
    button,
    bubbles: true,
    cancelable: true,
  });
  r.canvas.dispatchEvent(event);
  return event;
}

function click(r: rive.Rive, button: number) {
  mouse(r, "mousedown", button);
  mouse(r, "mouseup", button);
}

const NONE = {
  primaryDown: false,
  secondaryDown: false,
  middleDown: false,
  primaryUp: false,
  secondaryUp: false,
  primaryClick: false,
  plainClick: false,
};

describe("mouse buttons reach listeners bound to them", () => {
  const cases = [
    { name: "left", button: LEFT, fired: { primaryDown: true, primaryUp: true, primaryClick: true } },
    { name: "middle", button: MIDDLE, fired: { middleDown: true } },
    { name: "right", button: RIGHT, fired: { secondaryDown: true, secondaryUp: true } },
    { name: "back", button: BACK, fired: {} },
  ];

  test.each(cases)("A $name click fires only its own listeners", async ({ button, fired }) => {
    const r = await loadPad();
    click(r, button);
    expect(bools(r)).toEqual({ ...NONE, ...fired });
  });

  test.each(cases)(
    "A $name click after the pointer moves onto the pad fires only its own listeners",
    async ({ button, fired }) => {
      const r = await loadPad();
      mouse(r, "mouseover", LEFT);
      mouse(r, "mousemove", LEFT);
      click(r, button);
      expect(bools(r)).toEqual({ ...NONE, ...fired });
    },
  );
});

describe("a press nothing listens for", () => {
  test.each([
    ["right", RIGHT],
    ["middle", MIDDLE],
  ])(
    "A %s press whose release never comes leaves the next left click working",
    async (_, button) => {
      const r = await loadPad();
      // The context menu keeps the release of a right press it opens for.
      mouse(r, "mousedown", button, PLAIN_X);
      mouse(r, "mousedown", LEFT, PLAIN_X);
      mouse(r, "mouseup", LEFT, PLAIN_X);
      expect(bools(r).plainClick).toBe(true);
    },
  );

  test("A right click elsewhere in the middle of a left click leaves the left click working", async () => {
    const r = await loadPad();
    mouse(r, "mousedown", LEFT);
    mouse(r, "mousedown", RIGHT, PLAIN_X);
    mouse(r, "mouseup", RIGHT, PLAIN_X);
    mouse(r, "mouseup", LEFT);
    expect(bools(r).primaryClick).toBe(true);
  });

  test("never reaches a state machine without a listener for that button", async () => {
    const r = await load("assets/layout_scroll_vertical.riv", "State Machine 1");
    const pointerDown = jest.spyOn(smInstance(r), "pointerDown");
    mouse(r, "mousedown", RIGHT);
    mouse(r, "mousedown", MIDDLE);
    expect(pointerDown).not.toHaveBeenCalled();
    mouse(r, "mousedown", LEFT);
    expect(pointerDown).toHaveBeenCalledTimes(1);
  });
});

describe("the context menu", () => {
  test("is kept from opening over a secondary-button listener", async () => {
    const r = await loadPad();
    expect(mouse(r, "contextmenu", RIGHT).defaultPrevented).toBe(true);
  });

  test("opens beside a secondary-button listener, where nothing wants that button", async () => {
    const r = await loadPad();
    expect(mouse(r, "contextmenu", RIGHT, PLAIN_X).defaultPrevented).toBe(false);
  });

  test("is kept from opening when the press it follows moved its listener away", async () => {
    // A right press on "Target" moves it off the artboard as soon as it lands.
    const r = await load(
      "assets/pointer_buttons/pointer_buttons.riv",
      "Hop",
      { width: 300, height: 200 },
      "Hop",
    );
    mouse(r, "mousedown", RIGHT);
    expect(smInstance(r).listensToButtonAt(100, 100, 1)).toBe(false);
    expect(mouse(r, "contextmenu", RIGHT).defaultPrevented).toBe(true);
  });

  test("stays closed when Rive re-registers its listeners between the press and the menu", async () => {
    const r = await load(
      "assets/pointer_buttons/pointer_buttons.riv",
      "Hop",
      { width: 300, height: 200 },
      "Hop",
    );
    mouse(r, "mousedown", RIGHT);
    // play() re-registers the listeners, as when an event handler calls it.
    r.play();
    expect(mouse(r, "contextmenu", RIGHT).defaultPrevented).toBe(true);
  });

  test("opens where no listener wants the secondary button", async () => {
    const r = await load("assets/layout_scroll_vertical.riv", "State Machine 1");
    expect(mouse(r, "contextmenu", RIGHT).defaultPrevented).toBe(false);
  });
});

describe("scroll views follow only the primary button", () => {
  /** Presses `button` at the scroll view's middle and drags 100 up, without releasing. */
  async function dragUp(button: number) {
    const bounds = { width: 0, height: 0 };
    const r = await load(
      "assets/layout_scroll_vertical.riv",
      "State Machine 1",
      bounds,
    );
    const { maxX, maxY } = (r as any).artboard.bounds;
    bounds.width = maxX;
    bounds.height = maxY;
    const x = maxX / 2;
    const y = maxY / 2;
    const smi = smInstance(r);
    // At the top, so a wheel up has nothing to move.
    expect(smi.wantsScroll(x, y, 0, 50, 1, false)).toBe(false);
    mouse(r, "mousedown", button, x, y);
    for (let step = 1; step <= 10; step++) {
      mouse(r, "mousemove", button, x, y - step * 10);
      smi.advanceAndApply(0.016);
    }
    return { smi, x, y };
  }

  testWith("layout")("A left drag scrolls", async () => {
    const { smi, x, y } = await dragUp(LEFT);
    expect(smi.wantsScroll(x, y, 0, 50, 1, false)).toBe(true);
  });

  test("A right drag, its release lost to the context menu, does not scroll", async () => {
    const { smi, x, y } = await dragUp(RIGHT);
    expect(smi.wantsScroll(x, y, 0, 50, 1, false)).toBe(false);
  });
});
