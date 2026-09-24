import * as rive from "../src/rive";
import { loadFile } from "./helpers";

let canvas: HTMLCanvasElement;
let r: rive.Rive;

// Rendering is stopped after load and the test steps the state machine itself, so
// each assertion sees exactly the advances it asked for. One step is one draw
// minus rendering: advance, drain focus/blur listener events, pollFocusState.
function step(): void {
  (r as any).advanceAndReportChanges(0);
}

async function load(artboard: string): Promise<void> {
  await new Promise<void>((resolve) => {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    // Treat canvas focus as pointer-driven, so entering the tree is always an
    // explicit Tab (don't depend on jsdom's :focus-visible support).
    jest.spyOn(canvas, "matches").mockReturnValue(false);
    r = new rive.Rive({
      canvas,
      buffer: loadFile("assets/focus.riv"),
      artboard,
      stateMachine: "State Machine 1",
      autoplay: true,
      autoBind: true,
      onLoad: () => resolve(),
    });
  });
  r.stopRendering();
  // Keyboard interactions (and the canvas tabIndex) are created lazily by the
  // first step's pollFocusState.
  step();
}

// keydown + keyup, as a real key stroke delivers both.
function press(code: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const down = new KeyboardEvent("keydown", {
    code,
    key: code,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  canvas.dispatchEvent(down);
  canvas.dispatchEvent(
    new KeyboardEvent("keyup", { code, key: code, bubbles: true, ...init }),
  );
  return down;
}

function focusedButtons(count: number): string[] {
  const vmi = r.viewModelInstance!;
  const focused: string[] = [];
  for (let i = 1; i <= count; i++) {
    if (vmi.viewModel(`p${i}`)?.boolean("focused")?.value) focused.push(`p${i}`);
  }
  return focused;
}

// Pointer focus leaves Rive in EntryPending; the next Tab enters the tree at the
// first stop.
function enterTreeViaTab(): void {
  canvas.focus();
  press("Tab");
  step();
}

afterEach(() => {
  r?.cleanup();
  canvas?.remove();
});

describe("Grid: 3x3 Buttons p1..p9, row by row", () => {
  beforeEach(() => load("Grid"));

  const focused = () => focusedButtons(9);

  function enterGridAtFirstButton() {
    enterTreeViaTab();
    expect(focused()).toEqual(["p1"]);
  }

  test("arrow keys move focus by position through the grid", () => {
    enterGridAtFirstButton();

    press("ArrowRight");
    step();
    expect(focused()).toEqual(["p2"]);

    press("ArrowDown");
    step();
    expect(focused()).toEqual(["p5"]);

    press("ArrowLeft");
    step();
    expect(focused()).toEqual(["p4"]);

    press("ArrowUp");
    step();
    expect(focused()).toEqual(["p1"]);
  });

  test("an arrow at the grid edge keeps focus on Rive", () => {
    enterGridAtFirstButton();

    const up = press("ArrowUp");
    step();
    expect(focused()).toEqual(["p1"]);
    expect(up.defaultPrevented).toBe(true);
  });

  test("Shift+arrow moves focus, but browser-shortcut keys are left alone", () => {
    enterGridAtFirstButton();

    press("ArrowRight", { shiftKey: true });
    step();
    expect(focused()).toEqual(["p2"]);

    for (const chord of ["altKey", "ctrlKey", "metaKey"] as const) {
      const left = press("ArrowLeft", { [chord]: true });
      step();
      expect(focused()).toEqual(["p2"]);
      expect(left.defaultPrevented).toBe(false);
    }
  });

  test("focus listeners report a move after exactly one advance", () => {
    enterGridAtFirstButton();

    press("ArrowRight");
    // Rive focus moves synchronously; the listener-driven `focused` flags wait
    // for the next advance.
    expect(focused()).toEqual(["p1"]);
    step();
    expect(focused()).toEqual(["p2"]);
  });

  test("Tab traversal continues from the node an arrow moved focus to", () => {
    enterGridAtFirstButton();

    press("ArrowDown");
    step();
    expect(focused()).toEqual(["p4"]);

    press("Tab");
    step();
    expect(focused()).toEqual(["p5"]);

    press("Tab", { shiftKey: true });
    step();
    expect(focused()).toEqual(["p4"]);
  });

  test("arrows do nothing before a node is focused", () => {
    canvas.focus();
    const right = press("ArrowRight");
    step();
    expect(focused()).toEqual([]);
    expect(right.defaultPrevented).toBe(false);
  });
});

describe("TextInput: a text field (first Tab stop) above a Next Button (p1)", () => {
  beforeEach(() => load("TextInput"));

  // `text` is two-way bound to the field, so seeding it and reading edits back both
  // go through the view model.
  const text = () => r.viewModelInstance!.string("text")!.value;
  function seedText(value: string) {
    r.viewModelInstance!.string("text")!.value = value;
    step();
    expect(text()).toBe(value);
  }

  test("arrows in a focused text field move the caret, not focus", () => {
    enterTreeViaTab();
    expect(focusedButtons(1)).toEqual([]);
    seedText("ab");

    press("Home");
    const right = press("ArrowRight");
    step();
    expect(right.defaultPrevented).toBe(true);
    expect(focusedButtons(1)).toEqual([]);

    // Caret went from 0 to 1, so Backspace removes "a".
    press("Backspace");
    step();
    expect(text()).toBe("b");

    // Tab still leaves the field.
    press("Tab");
    step();
    expect(focusedButtons(1)).toEqual(["p1"]);
  });
});

describe("Tab at the edge of the focus tree", () => {
  const focusedLabels = (count: number) =>
    focusedButtons(count).map(
      (p) => r.viewModelInstance!.viewModel(p)!.string("label")!.value,
    );
  const session = () => (r as any)._keyboardInteractions.focusSessionState;

  test("a stop scope keeps focus on its last node", async () => {
    await load("EdgeStop");
    enterTreeViaTab();
    expect(focusedLabels(5)).toEqual(["Before"]);
    // The stop scope itself is a stop, then 1, 2, 3 inside it.
    for (let i = 0; i < 4; i++) press("Tab");
    step();
    expect(focusedLabels(5)).toEqual(["3"]);

    const tab = press("Tab");
    step();
    expect(focusedLabels(5)).toEqual(["3"]);
    expect(tab.defaultPrevented).toBe(true);
    expect(session()).toBe("riveFocused");
  });

  test("running off the end of the tree releases Tab to the page", async () => {
    await load("Grid");
    enterTreeViaTab();
    for (let i = 0; i < 8; i++) press("Tab");
    step();
    expect(focusedButtons(9)).toEqual(["p9"]);

    const tab = press("Tab");
    step();
    expect(focusedButtons(9)).toEqual([]);
    expect(tab.defaultPrevented).toBe(false);
    expect(session()).toBe("notFocused");
  });
});

describe("ClaimsTab: a keyboard listener that asks for Tab", () => {
  beforeEach(() => load("ClaimsTab"));

  const lastPressed = () => r.viewModelInstance!.string("lastPressed")!.value;

  test("a focused node's Tab listener claims Tab, so focus doesn't move", () => {
    enterTreeViaTab();
    expect(lastPressed()).not.toBe("tab");

    const tab = press("Tab");
    step();
    expect(lastPressed()).toBe("tab");
    expect(focusedButtons(1)).toEqual([]);
    expect(tab.defaultPrevented).toBe(true);

    const shiftTab = press("Tab", { shiftKey: true });
    step();
    expect(focusedButtons(1)).toEqual([]);
    expect(shiftTab.defaultPrevented).toBe(true);

    // Only Tab is claimed: arrows still move focus out of the trap.
    press("ArrowDown");
    step();
    expect(focusedButtons(1)).toEqual(["p1"]);
  });
});
