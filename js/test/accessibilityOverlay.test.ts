import { AccessibilityOverlay } from "../src/semantics/accessibilityOverlay";
import { SemanticTreeModel } from "../src/semantics/semanticTreeModel";
import { SemanticRole, SemanticState, SemanticTrait, SemanticActionType } from "../src/semantics/types";
import { node, children, bounds, diff } from "./semanticsFixtures";

class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
}

// Records every IntersectionObserver the overlay creates and lets tests fire
// its callback manually (jsdom has no real IntersectionObserver).
let intersectionObservers: MockIntersectionObserver[] = [];
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    intersectionObservers.push(this);
  }
  /** Test helper: invoke the registered callback as the browser would. */
  fire(): void {
    this.callback([] as unknown as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

function stubCanvasRect(
  canvas: HTMLCanvasElement,
  rect: { top: number; left: number; right: number; bottom: number }
): void {
  canvas.getBoundingClientRect = jest.fn(() => ({
    x: rect.left,
    y: rect.top,
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    toJSON: () => ({}),
  })) as unknown as HTMLCanvasElement["getBoundingClientRect"];
}

const identityMat = {
  xx: 1,
  xy: 0,
  yx: 0,
  yy: 1,
  tx: 0,
  ty: 0,
} as any;

const defaultArtboardBounds = { minX: 0, minY: 0, maxX: 500, maxY: 500 };
const testInstanceId = "test";

function semanticId(nodeId: number): string {
  return `rive-${testInstanceId}-sem-${nodeId}`;
}

function createOverlay(
  canvas: HTMLCanvasElement,
  opts: { allowFocusInterrupt?: boolean } = {}
) {
  return new AccessibilityOverlay({
    canvas,
    instanceId: testInstanceId,
    semanticsOptions: {
      riveCanvasLabel: "Test animation",
    },
    fireAction: jest.fn(),
    requestFocus: jest.fn(),
    clearFocus: jest.fn(),
    allowFocusInterrupt: opts.allowFocusInterrupt,
  });
}

describe("AccessibilityOverlay", () => {
  beforeEach(() => {
    (window as any).ResizeObserver = MockResizeObserver;
    (window as any).IntersectionObserver = MockIntersectionObserver;
    intersectionObservers = [];
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("keeps interactive semantic nodes out of sequential tab order", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [
        node(1, { role: SemanticRole.button, label: "Play" }),
        node(2, {
          role: SemanticRole.text,
          label: "Caption",
          traitFlags: SemanticTrait.Focusable,
        }),
        node(3, { role: SemanticRole.text, label: "Static text" }),
      ],
    }));

    const overlay = createOverlay(canvas);

    overlay.update(tree, null, 1, defaultArtboardBounds);

    expect(document.getElementById(semanticId(1))?.getAttribute("tabindex")).toBe(
      "-1"
    );
    expect(document.getElementById(semanticId(2))?.getAttribute("tabindex")).toBe(
      "-1"
    );
    expect(document.getElementById(semanticId(3))?.hasAttribute("tabindex")).toBe(false);

    overlay.destroy();
  });

  test("overlay container has role=region for landmark navigation", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const overlay = createOverlay(canvas);

    const container = document.querySelector('[id^="rive-a11y-"]');
    expect(container?.getAttribute("role")).toBe("region");
    expect(container?.getAttribute("aria-label")).toBe("Test animation");

    overlay.destroy();
  });

  test("element receives DOM focus when C++ sets the Focused state (focus already in scope)", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [node(1, { role: SemanticRole.button, label: "Play", traitFlags: SemanticTrait.Focusable })],
    }));

    const overlay = createOverlay(canvas);
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    const el = document.getElementById(semanticId(1))!;
    expect(document.activeElement).not.toBe(el);
    overlay.getSemanticOverlayContainer().focus();

    tree.applyDiff(diff({
      updatedSemantic: [node(1, {
        role: SemanticRole.button,
        label: "Play",
        traitFlags: SemanticTrait.Focusable,
        stateFlags: SemanticState.Focused,
      })],
    }));
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    expect(document.activeElement).toBe(el);

    overlay.destroy();
  });

  test("does not steal focus from the host page when focus is out of scope (default)", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    // A host-page element that holds focus, outside the Rive instance.
    const hostInput = document.createElement("input");
    document.body.appendChild(hostInput);
    hostInput.focus();
    expect(document.activeElement).toBe(hostInput);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [node(1, {
        role: SemanticRole.button,
        label: "Play",
        traitFlags: SemanticTrait.Focusable,
        stateFlags: SemanticState.Focused,
      })],
    }));

    const overlay = createOverlay(canvas);
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    // allowFocusInterrupt defaults to false, so the runtime Focused state must
    // NOT pull focus away from the host page (this also covers initial load).
    expect(document.activeElement).toBe(hostInput);

    overlay.destroy();
  });

  test("steals focus from the host page when allowFocusInterrupt is true", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const hostInput = document.createElement("input");
    document.body.appendChild(hostInput);
    hostInput.focus();

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [node(1, {
        role: SemanticRole.button,
        label: "Play",
        traitFlags: SemanticTrait.Focusable,
        stateFlags: SemanticState.Focused,
      })],
    }));

    const overlay = createOverlay(canvas, { allowFocusInterrupt: true });
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    const el = document.getElementById(semanticId(1))!;
    expect(document.activeElement).toBe(el);

    overlay.destroy();
  });

  test("unrelated tree change does not re-fire focus on already-focused element", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [
        node(1, { role: SemanticRole.button, label: "Play", traitFlags: SemanticTrait.Focusable, stateFlags: SemanticState.Focused }),
        node(2, { role: SemanticRole.button, label: "Pause" }),
      ],
    }));

    const requestFocus = jest.fn();
    const overlay = new AccessibilityOverlay({
      canvas,
      instanceId: testInstanceId,
      semanticsOptions: { riveCanvasLabel: "Test" },
      fireAction: jest.fn(),
      requestFocus,
      clearFocus: jest.fn(),
      allowFocusInterrupt: true,
    });
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    // el1 already has DOM focus from the initial render (allowFocusInterrupt
    // lets the runtime Focused state drive focus even from the host page)
    const el1 = document.getElementById(semanticId(1))!;
    expect(document.activeElement).toBe(el1);
    requestFocus.mockClear();

    // Unrelated change: node 2's label updates
    tree.applyDiff(diff({
      updatedSemantic: [node(2, { role: SemanticRole.button, label: "Stop" })],
    }));
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    // el1 still has focus but requestFocus was NOT re-fired
    expect(document.activeElement).toBe(el1);
    expect(requestFocus).not.toHaveBeenCalled();

    overlay.destroy();
  });

  // TODO: revisit behavior in iOS safari and desktop
  test("list and listItem get explicit roles to survive list-style:none stripping in Safari", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [
        node(1, { role: SemanticRole.list }),
        node(2, { role: SemanticRole.listItem, label: "Item", parentId: 1 }),
      ],
      childrenUpdated: [children(1, [2])],
    }));

    const overlay = createOverlay(canvas);
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    expect(document.getElementById(semanticId(1))?.getAttribute("role")).toBe("list");
    expect(document.getElementById(semanticId(2))?.getAttribute("role")).toBe("listitem");

    overlay.destroy();
  });

  test("node with Obscured state gets aria-hidden=true", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [node(1, { role: SemanticRole.button, label: "Behind modal", stateFlags: SemanticState.Obscured })],
    }));

    const overlay = createOverlay(canvas);
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    expect(document.getElementById(semanticId(1))?.getAttribute("aria-hidden")).toBe("true");

    overlay.destroy();
  });

  test("alertDialog always gets aria-modal=true regardless of Modal state flag", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [node(1, { role: SemanticRole.alertDialog, label: "Alert" })],
    }));

    const overlay = createOverlay(canvas);
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    expect(document.getElementById(semanticId(1))?.getAttribute("aria-modal")).toBe("true");

    overlay.destroy();
  });

  test("dialog only gets aria-modal when Modal state flag is set", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [
        node(1, { role: SemanticRole.dialog, label: "Non-modal dialog" }),
        node(2, { role: SemanticRole.dialog, label: "Modal dialog", stateFlags: SemanticState.Modal }),
      ],
    }));

    const overlay = createOverlay(canvas);
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    expect(document.getElementById(semanticId(1))?.getAttribute("aria-modal")).toBeNull();
    expect(document.getElementById(semanticId(2))?.getAttribute("aria-modal")).toBe("true");

    overlay.destroy();
  });

  test("ArrowRight on a tab focuses the next tab and fires tap action", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [
        node(1, { role: SemanticRole.tabList }),
        node(2, { role: SemanticRole.tab, label: "Tab A", parentId: 1, siblingIndex: 0 }),
        node(3, { role: SemanticRole.tab, label: "Tab B", parentId: 1, siblingIndex: 1 }),
        node(4, { role: SemanticRole.tab, label: "Tab C", parentId: 1, siblingIndex: 2 }),
      ],
      childrenUpdated: [children(1, [2, 3, 4])],
    }));

    const fireAction = jest.fn();
    const overlay = new AccessibilityOverlay({
      canvas,
      instanceId: testInstanceId,
      semanticsOptions: { riveCanvasLabel: "Test" },
      fireAction,
      requestFocus: jest.fn(),
      clearFocus: jest.fn(),
    });
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    const tab1 = document.getElementById(semanticId(2))!;
    const tab2 = document.getElementById(semanticId(3))!;

    tab1.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(document.activeElement).toBe(tab2);
    expect(fireAction).toHaveBeenCalledWith(3, SemanticActionType.tap);

    overlay.destroy();
  });

  test("ArrowLeft on the first tab wraps to the last tab", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [
        node(1, { role: SemanticRole.tabList }),
        node(2, { role: SemanticRole.tab, label: "Tab A", parentId: 1, siblingIndex: 0 }),
        node(3, { role: SemanticRole.tab, label: "Tab B", parentId: 1, siblingIndex: 1 }),
      ],
      childrenUpdated: [children(1, [2, 3])],
    }));

    const fireAction = jest.fn();
    const overlay = new AccessibilityOverlay({
      canvas,
      instanceId: testInstanceId,
      semanticsOptions: { riveCanvasLabel: "Test" },
      fireAction,
      requestFocus: jest.fn(),
      clearFocus: jest.fn(),
    });
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    const tab1 = document.getElementById(semanticId(2))!;
    const tabLast = document.getElementById(semanticId(3))!;

    tab1.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));

    expect(document.activeElement).toBe(tabLast);
    expect(fireAction).toHaveBeenCalledWith(3, SemanticActionType.tap);

    overlay.destroy();
  });

  test("ArrowDown on a radio button focuses the next radio and fires tap action", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [
        node(1, { role: SemanticRole.radioGroup }),
        node(2, { role: SemanticRole.radioButton, label: "Option A", parentId: 1, siblingIndex: 0 }),
        node(3, { role: SemanticRole.radioButton, label: "Option B", parentId: 1, siblingIndex: 1 }),
        node(4, { role: SemanticRole.radioButton, label: "Option C", parentId: 1, siblingIndex: 2 }),
      ],
      childrenUpdated: [children(1, [2, 3, 4])],
    }));

    const fireAction = jest.fn();
    const overlay = new AccessibilityOverlay({
      canvas,
      instanceId: testInstanceId,
      semanticsOptions: { riveCanvasLabel: "Test" },
      fireAction,
      requestFocus: jest.fn(),
      clearFocus: jest.fn(),
    });
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    const radio1 = document.getElementById(semanticId(2))!;
    const radio2 = document.getElementById(semanticId(3))!;

    radio1.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(document.activeElement).toBe(radio2);
    expect(fireAction).toHaveBeenCalledWith(3, SemanticActionType.tap);

    overlay.destroy();
  });

  test("ArrowUp on the first radio button wraps to the last radio button", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({
      added: [
        node(1, { role: SemanticRole.radioGroup }),
        node(2, { role: SemanticRole.radioButton, label: "A", parentId: 1, siblingIndex: 0 }),
        node(3, { role: SemanticRole.radioButton, label: "B", parentId: 1, siblingIndex: 1 }),
      ],
      childrenUpdated: [children(1, [2, 3])],
    }));

    const fireAction = jest.fn();
    const overlay = new AccessibilityOverlay({
      canvas,
      instanceId: testInstanceId,
      semanticsOptions: { riveCanvasLabel: "Test" },
      fireAction,
      requestFocus: jest.fn(),
      clearFocus: jest.fn(),
    });
    overlay.update(tree, identityMat, 1, defaultArtboardBounds);

    const radio1 = document.getElementById(semanticId(2))!;
    const radioLast = document.getElementById(semanticId(3))!;

    radio1.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    expect(document.activeElement).toBe(radioLast);
    expect(fireAction).toHaveBeenCalledWith(3, SemanticActionType.tap);

    overlay.destroy();
  });

  // ---------------------------------------------------------------------------
  // Dialog auto-focus on appearance (autoFocusDialogOnAppear / routeDefaultFocusTarget)
  // ---------------------------------------------------------------------------

  describe("dialog auto-focus on appearance", () => {
    function setup(
      added: ReturnType<typeof node>[],
      childrenUpdated: ReturnType<typeof children>[] = [],
      overlayOpts: { allowFocusInterrupt?: boolean } = {}
    ) {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added, childrenUpdated }));
      const overlay = createOverlay(canvas, overlayOpts);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      return { overlay, tree, canvas };
    }

    test("moves focus to the first focusable descendant when a modal dialog appears", () => {
      const { overlay } = setup(
        [
          node(1, { role: SemanticRole.alertDialog, label: "Alert" }),
          node(2, { role: SemanticRole.button, label: "OK", traitFlags: SemanticTrait.Focusable, parentId: 1, siblingIndex: 0 }),
          node(3, { role: SemanticRole.text, label: "Body text", parentId: 1, siblingIndex: 1 }),
        ],
        [children(1, [2, 3])],
        { allowFocusInterrupt: true }
      );

      expect(document.activeElement).toBe(document.getElementById(semanticId(2)));
      overlay.destroy();
    });

    test("focuses on text via the inner span of the first text leaf when there is no focusable child", () => {
      const { overlay } = setup(
        [
          node(1, { role: SemanticRole.alertDialog, label: "Alert" }),
          node(2, { role: SemanticRole.text, label: "Sky is falling", parentId: 1 }),
        ],
        [children(1, [2])],
        { allowFocusInterrupt: true }
      );

      const span = document.getElementById(semanticId(2))!.querySelector("span");
      expect(document.activeElement).toBe(span);
      overlay.destroy();
    });

    test("descends into a container to find the focusable target", () => {
      const { overlay } = setup(
        [
          node(1, { role: SemanticRole.alertDialog, label: "Alert" }),
          node(2, { role: SemanticRole.group, parentId: 1 }),
          node(3, { role: SemanticRole.button, label: "OK", traitFlags: SemanticTrait.Focusable, parentId: 2 }),
        ],
        [children(1, [2]), children(2, [3])],
        { allowFocusInterrupt: true }
      );

      expect(document.activeElement).toBe(document.getElementById(semanticId(3)));
      overlay.destroy();
    });

    test("a descendant the runtime marked Focused is not overridden by the first focusable DOM element", () => {
      const { overlay } = setup(
        [
          node(1, { role: SemanticRole.alertDialog, label: "Alert" }),
          node(2, { role: SemanticRole.button, label: "First", traitFlags: SemanticTrait.Focusable, parentId: 1, siblingIndex: 0 }),
          node(3, { role: SemanticRole.button, label: "Second", traitFlags: SemanticTrait.Focusable, stateFlags: SemanticState.Focused, parentId: 1, siblingIndex: 1 }),
        ],
        [children(1, [2, 3])],
        { allowFocusInterrupt: true }
      );

      // The route default would be the first focusable (#2), but #3 was focused
      // during the rebuild, so autoFocus must not override it.
      expect(document.activeElement).toBe(document.getElementById(semanticId(3)));
      overlay.destroy();
    });

    test("falls back to focusing the dialog container when no focusable child exists", () => {
      const { overlay } = setup(
        [
          node(1, { role: SemanticRole.alertDialog, label: "Alert" }),
          node(2, { role: SemanticRole.group, parentId: 1 }), // unlabeled, non-focusable, no children
        ],
        [children(1, [2])],
        { allowFocusInterrupt: true }
      );

      expect(document.activeElement).toBe(document.getElementById(semanticId(1)));
      overlay.destroy();
    });

    test("does not hijack focus for a modal dialog present on initial load when focus is out of scope", () => {
      // Default overlay (allowFocusInterrupt=false); focus starts on the host page.
      const { overlay } = setup(
        [
          node(1, { role: SemanticRole.alertDialog, label: "Alert" }),
          node(2, { role: SemanticRole.text, label: "Sky is falling", parentId: 1 }),
        ],
        [children(1, [2])]
      );

      expect(document.activeElement).toBe(document.body);
      overlay.destroy();
    });

    test("does not auto-focus a non-modal dialog", () => {
      const { overlay } = setup(
        [
          node(1, { role: SemanticRole.dialog, label: "Plain" }), // no Modal state flag
          node(2, { role: SemanticRole.button, label: "OK", traitFlags: SemanticTrait.Focusable, parentId: 1 }),
        ],
        [children(1, [2])],
        { allowFocusInterrupt: true }
      );

      expect(document.activeElement).toBe(document.body);
      overlay.destroy();
    });

    test("does not re-focus the dialog on a later unrelated update", () => {
      const { overlay, tree } = setup(
        [
          node(1, { role: SemanticRole.alertDialog, label: "Alert" }),
          node(2, { role: SemanticRole.text, label: "Sky is falling", parentId: 1 }),
        ],
        [children(1, [2])],
        { allowFocusInterrupt: true }
      );

      const span = document.getElementById(semanticId(2))!.querySelector("span");
      expect(document.activeElement).toBe(span);

      // Move focus to a host-page element, then trigger an unrelated tree change.
      const hostInput = document.createElement("input");
      document.body.appendChild(hostInput);
      hostInput.focus();
      expect(document.activeElement).toBe(hostInput);

      tree.applyDiff(diff({
        updatedSemantic: [node(2, { role: SemanticRole.text, label: "Updated body", parentId: 1 })],
      }));
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      // The dialog is no longer new, so autoFocus must not fire again.
      expect(document.activeElement).toBe(hostInput);
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Modal focus trap (trappedByModal in rebuildChildren)
  // ---------------------------------------------------------------------------

  describe("modal focus trap", () => {
    test("a Focused background node does not steal focus while a modal dialog holds it", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [
          node(1, { role: SemanticRole.alertDialog, label: "Alert", siblingIndex: 0 }),
          node(2, { role: SemanticRole.button, label: "Inside", traitFlags: SemanticTrait.Focusable, parentId: 1 }),
          node(3, { role: SemanticRole.button, label: "Background", traitFlags: SemanticTrait.Focusable, siblingIndex: 1 }),
        ],
        childrenUpdated: [children(1, [2])],
      }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      // Put focus inside the modal dialog.
      const inside = document.getElementById(semanticId(2))!;
      inside.focus();
      expect(document.activeElement).toBe(inside);

      // The runtime now marks the background node Focused.
      tree.applyDiff(diff({
        updatedSemantic: [node(3, { role: SemanticRole.button, label: "Background", traitFlags: SemanticTrait.Focusable, stateFlags: SemanticState.Focused, siblingIndex: 1 })],
      }));
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      // Focus stays trapped inside the dialog.
      expect(document.activeElement).toBe(inside);
      overlay.destroy();
    });

    test("a Focused node inside the same modal still receives focus (descendants are allowed)", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [
          node(1, { role: SemanticRole.alertDialog, label: "Alert" }),
          node(2, { role: SemanticRole.button, label: "First", traitFlags: SemanticTrait.Focusable, parentId: 1, siblingIndex: 0 }),
          node(3, { role: SemanticRole.button, label: "Second", traitFlags: SemanticTrait.Focusable, parentId: 1, siblingIndex: 1 }),
        ],
        childrenUpdated: [children(1, [2, 3])],
      }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      const first = document.getElementById(semanticId(2))!;
      first.focus();
      expect(document.activeElement).toBe(first);

      tree.applyDiff(diff({
        updatedSemantic: [node(3, { role: SemanticRole.button, label: "Second", traitFlags: SemanticTrait.Focusable, stateFlags: SemanticState.Focused, parentId: 1, siblingIndex: 1 })],
      }));
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      const second = document.getElementById(semanticId(3))!;
      expect(document.activeElement).toBe(second);
      overlay.destroy();
    });

    test("an external host-page modal does not trap the overlay's focus", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);

      // A modal that belongs to the host page, not the Rive overlay.
      const hostModal = document.createElement("div");
      hostModal.setAttribute("aria-modal", "true");
      hostModal.tabIndex = -1;
      document.body.appendChild(hostModal);
      hostModal.focus();
      expect(document.activeElement).toBe(hostModal);

      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [node(1, { role: SemanticRole.button, label: "Rive button", traitFlags: SemanticTrait.Focusable, stateFlags: SemanticState.Focused })],
      }));
      const overlay = createOverlay(canvas, { allowFocusInterrupt: true });
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      // The external modal must not suppress our runtime-driven focus.
      expect(document.activeElement).toBe(document.getElementById(semanticId(1)));
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Activation handlers (click / keyboard)
  // ---------------------------------------------------------------------------

  describe("activation handlers", () => {
    function makeOverlayWithRole(role: number, label = "x") {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role, label })] }));
      const fireAction = jest.fn();
      const overlay = new AccessibilityOverlay({
        canvas,
        instanceId: testInstanceId,
        semanticsOptions: { riveCanvasLabel: "Test" },
        fireAction,
        requestFocus: jest.fn(),
        clearFocus: jest.fn(),
      });
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      const el = document.getElementById(semanticId(1))!;
      return { el, fireAction, overlay };
    }

    test("click on a button fires tap action", () => {
      const { el, fireAction, overlay } = makeOverlayWithRole(SemanticRole.button, "Go");
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(fireAction).toHaveBeenCalledWith(1, SemanticActionType.tap);
      overlay.destroy();
    });

    test("Enter/Space on a button fires tap action", () => {
      const { el, fireAction, overlay } = makeOverlayWithRole(SemanticRole.button, "Go");
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      expect(fireAction).toHaveBeenCalledWith(1, SemanticActionType.tap);
      expect(fireAction).toHaveBeenCalledTimes(2);
      overlay.destroy();
    });

    test("Enter/space on a checkbox fires tap action", () => {
      const { el, fireAction, overlay } = makeOverlayWithRole(SemanticRole.checkbox, "Accept");
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      expect(fireAction).toHaveBeenCalledWith(1, SemanticActionType.tap);
      expect(fireAction).toHaveBeenCalledTimes(2);
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Slider keyboard actions
  // ---------------------------------------------------------------------------

  describe("slider keyboard actions", () => {
    function makeSliderOverlay() {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role: SemanticRole.slider, label: "Volume" })] }));
      const fireAction = jest.fn();
      const overlay = new AccessibilityOverlay({
        canvas,
        instanceId: testInstanceId,
        semanticsOptions: { riveCanvasLabel: "Test" },
        fireAction,
        requestFocus: jest.fn(),
        clearFocus: jest.fn(),
      });
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      const el = document.getElementById(semanticId(1))!;
      return { el, fireAction, overlay };
    }

    test("ArrowRight/Up fires increase action", () => {
      const { el, fireAction, overlay } = makeSliderOverlay();
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
      expect(fireAction).toHaveBeenCalledWith(1, SemanticActionType.increase);
      expect(fireAction).toHaveBeenCalledTimes(2);
      overlay.destroy();
    });

    test("ArrowLeft/Down fires decrease action", () => {
      const { el, fireAction, overlay } = makeSliderOverlay();
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      expect(fireAction).toHaveBeenCalledWith(1, SemanticActionType.decrease);
      expect(fireAction).toHaveBeenCalledTimes(2);
      overlay.destroy();
    });

    test("slider arrow keys do not propagate (default is prevented)", () => {
      const { el, overlay } = makeSliderOverlay();
      const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // AT focus → requestFocus routing
  // ---------------------------------------------------------------------------

  describe("AT focus routes to requestFocus", () => {
    test("focusing a Focusable node calls requestFocus with its node ID", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [node(1, { role: SemanticRole.button, label: "Play", traitFlags: SemanticTrait.Focusable })],
      }));
      const requestFocus = jest.fn();
      const overlay = new AccessibilityOverlay({
        canvas,
        instanceId: testInstanceId,
        semanticsOptions: { riveCanvasLabel: "Test" },
        fireAction: jest.fn(),
        requestFocus,
        clearFocus: jest.fn(),
      });
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      const el = document.getElementById(semanticId(1))!;
      el.dispatchEvent(new FocusEvent("focus", { bubbles: true }));

      expect(requestFocus).toHaveBeenCalledWith(1);
      overlay.destroy();
    });

    test("focusing a node without the Focusable trait does NOT call requestFocus", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        // button role but no Focusable trait
        added: [node(1, { role: SemanticRole.button, label: "Play" })],
      }));
      const requestFocus = jest.fn();
      const overlay = new AccessibilityOverlay({
        canvas,
        instanceId: testInstanceId,
        semanticsOptions: { riveCanvasLabel: "Test" },
        fireAction: jest.fn(),
        requestFocus,
        clearFocus: jest.fn(),
      });
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      const el = document.getElementById(semanticId(1))!;
      el.dispatchEvent(new FocusEvent("focus", { bubbles: true }));

      expect(requestFocus).not.toHaveBeenCalled();
      overlay.destroy();
    });

    test("requestFocus is called with the correct node ID when multiple Focusable nodes exist", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [
          node(1, { role: SemanticRole.button, label: "First", traitFlags: SemanticTrait.Focusable }),
          node(2, { role: SemanticRole.button, label: "Second", traitFlags: SemanticTrait.Focusable }),
        ],
      }));
      const requestFocus = jest.fn();
      const overlay = new AccessibilityOverlay({
        canvas,
        instanceId: testInstanceId,
        semanticsOptions: { riveCanvasLabel: "Test" },
        fireAction: jest.fn(),
        requestFocus,
        clearFocus: jest.fn(),
      });
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      document.getElementById(semanticId(2))!
        .dispatchEvent(new FocusEvent("focus", { bubbles: true }));

      expect(requestFocus).toHaveBeenCalledTimes(1);
      expect(requestFocus).toHaveBeenCalledWith(2);
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Node positioning
  // ---------------------------------------------------------------------------

  describe("node positioning", () => {
    function makeOverlayWithNode(nodeOpts: Parameters<typeof node>[1], artboardBounds = defaultArtboardBounds) {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, nodeOpts)] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, artboardBounds);
      return { el: document.getElementById(semanticId(1))!, overlay };
    }

    test("sets CSS left/top/width/height from artboard-space bounds", () => {
      const { el, overlay } = makeOverlayWithNode({ minX: 10, minY: 20, maxX: 60, maxY: 50 });
      expect(el.style.left).toBe("10px");
      expect(el.style.top).toBe("20px");
      expect(el.style.width).toBe("50px");
      expect(el.style.height).toBe("30px");
      overlay.destroy();
    });

    test("child position is offset relative to parent's artboard origin", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [
          node(1, { minX: 100, minY: 100, maxX: 400, maxY: 400 }),
          node(2, { parentId: 1, minX: 150, minY: 160, maxX: 250, maxY: 200 }),
        ],
        childrenUpdated: [children(1, [2])],
      }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      const child = document.getElementById(semanticId(2))!;
      expect(child.style.left).toBe("50px");  // 150 - 100
      expect(child.style.top).toBe("60px");   // 160 - 100
      expect(child.style.width).toBe("100px");
      expect(child.style.height).toBe("40px");
      overlay.destroy();
    });

    test("node bounds are clamped to the artboard viewport", () => {
      const artboard = { minX: 0, minY: 0, maxX: 335, maxY: 737 };
      const { el, overlay } = makeOverlayWithNode(
        { minX: 0, minY: 0, maxX: 335, maxY: 1315 },
        artboard
      );
      expect(el.style.width).toBe("335px");
      expect(el.style.height).toBe("737px"); // clamped to artboard maxY
      overlay.destroy();
    });

    test("node fully above artboard gets zero height", () => {
      const artboard = { minX: 0, minY: 0, maxX: 335, maxY: 737 };
      // Scrolled-past item sitting above the viewport
      const { el, overlay } = makeOverlayWithNode(
        { minX: 0, minY: -200, maxX: 335, maxY: -50 },
        artboard
      );
      expect(el.style.width).toBe("335px");
      expect(el.style.height).toBe("0px");
      overlay.destroy();
    });

    test("sub-pixel bounds are rounded to whole artboard units", () => {
      const { el, overlay } = makeOverlayWithNode({ minX: 5.4, minY: 8.7, maxX: 55.4, maxY: 38.7 });
      expect(el.style.left).toBe("5px");   // Math.round(5.4)
      expect(el.style.top).toBe("9px");    // Math.round(8.7)
      expect(el.style.width).toBe("50px"); // Math.round(50.0)
      expect(el.style.height).toBe("30px");// Math.round(30.0)
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA role and tag mapping
  // ---------------------------------------------------------------------------

  describe("ARIA role and element tag mapping", () => {
    function roleEl(role: number, label = "test") {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role, label })] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      const el = document.getElementById(semanticId(1))!;
      return { el, overlay };
    }

    // Ensures each element maps to the expected ARIA role on the element itself
    test.each([
      [SemanticRole.button,      "button"],
      [SemanticRole.checkbox,    "checkbox"],
      [SemanticRole.switchControl, "switch"],
      [SemanticRole.slider,      "slider"],
      [SemanticRole.textField,   "textbox"],
      [SemanticRole.image,       "img"],
      [SemanticRole.group,       "group"],
      [SemanticRole.list,        "list"],
      [SemanticRole.listItem,    "listitem"],
      [SemanticRole.tab,         "tab"],
      [SemanticRole.tabList,     "tablist"],
      [SemanticRole.dialog,      "dialog"],
      [SemanticRole.alertDialog, "alertdialog"],
      [SemanticRole.radioGroup,  "radiogroup"],
      [SemanticRole.radioButton, "radio"],
    ])("role %i maps to aria role %s", (semRole, ariaRole) => {
      const { el, overlay } = roleEl(semRole);
      expect(el.getAttribute("role")).toBe(ariaRole);
      overlay.destroy();
    });

    test("text role has no explicit ARIA role attribute, but has span with text content", () => {
      const { el, overlay } = roleEl(SemanticRole.text, "hello");
      expect(el.getAttribute("role")).toBeNull();
      expect(el.querySelector("span")!.textContent).toBe("hello");
      overlay.destroy();
    });

    test("roles will use a <div> element in non-special roles", () => {
      const { el: btn, overlay: o1 } = roleEl(SemanticRole.button);
      const { el: cb,  overlay: o2 } = roleEl(SemanticRole.checkbox);
      expect(btn.tagName.toLowerCase()).toBe("div");
      expect(cb.tagName.toLowerCase()).toBe("div");
      o1.destroy(); o2.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Trait-gated ARIA states
  // ---------------------------------------------------------------------------

  describe("trait-gated ARIA states", () => {
    function applyAndGet(role: number, traitFlags: number, stateFlags: number, label = "x") {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role, label, traitFlags, stateFlags })] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      const el = document.getElementById(semanticId(1))!;
      return { el, overlay };
    }

    test("checkbox with Checkable+Checked gets aria-checked=true", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.checkbox,
        SemanticTrait.Checkable,
        SemanticState.Checked
      );
      expect(el.getAttribute("aria-checked")).toBe("true");
      overlay.destroy();
    });

    test("checkbox with Checkable+Mixed gets aria-checked=mixed", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.checkbox,
        SemanticTrait.Checkable,
        SemanticState.Mixed
      );
      expect(el.getAttribute("aria-checked")).toBe("mixed");
      overlay.destroy();
    });

    test("aria-checked is removed when Checkable trait is absent", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.checkbox,
        SemanticTrait.None,
        SemanticState.Checked
      );
      expect(el.getAttribute("aria-checked")).toBeNull();
      overlay.destroy();
    });

    test("switch with Toggleable+Toggled gets aria-checked=true", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.switchControl,
        SemanticTrait.Toggleable,
        SemanticState.Toggled
      );
      expect(el.getAttribute("aria-checked")).toBe("true");
      expect(el.getAttribute("aria-pressed")).toBeNull();
      overlay.destroy();
    });

    test("button with Toggleable+Toggled gets aria-pressed=true", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.button,
        SemanticTrait.Toggleable,
        SemanticState.Toggled
      );
      expect(el.getAttribute("aria-pressed")).toBe("true");
      overlay.destroy();
    });

    test("button with Expandable+Expanded gets aria-expanded=true", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.button,
        SemanticTrait.Expandable,
        SemanticState.Expanded
      );
      expect(el.getAttribute("aria-expanded")).toBe("true");
      overlay.destroy();
    });

    test("aria-expanded is removed when Expandable trait is absent", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.button,
        SemanticTrait.None,
        SemanticState.Expanded
      );
      expect(el.getAttribute("aria-expanded")).toBeNull();
      overlay.destroy();
    });

    test("tab always gets aria-selected regardless of Selectable trait if state is selected", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.tab,
        SemanticTrait.None,     // no Selectable trait
        SemanticState.Selected
      );
      expect(el.getAttribute("aria-selected")).toBe("true");
      overlay.destroy();
    });

    test("Enablable+Disabled gets aria-disabled=true", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.button,
        SemanticTrait.Enablable,
        SemanticState.Disabled
      );
      expect(el.getAttribute("aria-disabled")).toBe("true");
      overlay.destroy();
    });

    test("Requirable+Required on textField gets aria-required=true", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.textField,
        SemanticTrait.Requirable,
        SemanticState.Required
      );
      expect(el.getAttribute("aria-required")).toBe("true");
      overlay.destroy();
    });

    test("aria-hidden is set for Hidden state", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.button, SemanticTrait.None, SemanticState.Hidden, "hidden btn"
      );
      expect(el.getAttribute("aria-hidden")).toBe("true");
      overlay.destroy();
    });

    test("image with no label is treated as decorative and gets aria-hidden", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role: SemanticRole.image, label: "" })] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      expect(document.getElementById(semanticId(1))?.getAttribute("aria-hidden")).toBe("true");
      overlay.destroy();
    });

    test("LiveRegion state gets aria-live=polite", () => {
      const { el, overlay } = applyAndGet(
        SemanticRole.text, SemanticTrait.None, SemanticState.LiveRegion, "live"
      );
      expect(el.getAttribute("aria-live")).toBe("polite");
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Role-specific ARIA attributes
  // ---------------------------------------------------------------------------

  describe("role-specific ARIA attributes", () => {
    test("slider gets aria-orientation=horizontal", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role: SemanticRole.slider, label: "Volume" })] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      expect(document.getElementById(semanticId(1))?.getAttribute("aria-orientation")).toBe("horizontal");
      overlay.destroy();
    });

    test("slider with value gets aria-valuenow and aria-valuetext", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role: SemanticRole.slider, label: "Volume", value: "75" })] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      const el = document.getElementById(semanticId(1))!;
      expect(el.getAttribute("aria-valuenow")).toBe("75");
      expect(el.getAttribute("aria-valuetext")).toBe("75");
      overlay.destroy();
    });

    test("text node with headingLevel gets role=heading and aria-level", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role: SemanticRole.text, label: "Section", headingLevel: 2 })] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      const el = document.getElementById(semanticId(1))!;
      expect(el.getAttribute("role")).toBe("heading");
      expect(el.getAttribute("aria-level")).toBe("2");
      overlay.destroy();
    });

    test("heading reverting to plain text drops role and aria-level", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role: SemanticRole.text, label: "Section", headingLevel: 2 })] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      tree.applyDiff(diff({ updatedSemantic: [node(1, { role: SemanticRole.text, label: "Section", headingLevel: 0 })] }));
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      const el = document.getElementById(semanticId(1))!;
      expect(el.getAttribute("role")).toBeNull();
      expect(el.getAttribute("aria-level")).toBeNull();
      overlay.destroy();
    });

    test("hint creates a visually-hidden span referenced by aria-describedby", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role: SemanticRole.button, label: "Submit", hint: "Sends the form" })] }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      const el = document.getElementById(semanticId(1))!;
      const descId = el.getAttribute("aria-describedby");
      expect(descId).toBeTruthy();
      expect(document.getElementById(descId!)?.textContent).toBe("Sends the form");
      overlay.destroy();
    });
  });

  describe("attribute application is gated per changed node", () => {
    test("unchanged sibling receives no attribute mutations when another node changes", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [
          node(1, { role: SemanticRole.button, label: "Play", siblingIndex: 0 }),
          node(2, { role: SemanticRole.button, label: "Stop", siblingIndex: 1 }),
        ],
      }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      // Even redundant same-value setAttribute calls fire mutation records
      // that can knock VoiceOver off its current element — the untouched
      // sibling must see zero attribute traffic.
      const sibling = document.getElementById(semanticId(2))!;
      const setSpy = jest.spyOn(sibling, "setAttribute");
      const removeSpy = jest.spyOn(sibling, "removeAttribute");

      tree.applyDiff(diff({
        updatedSemantic: [node(1, { role: SemanticRole.button, label: "Pause", siblingIndex: 0 })],
      }));
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      expect(
        document.getElementById(semanticId(1))!.getAttribute("aria-label")
      ).toBe("Pause");
      expect(setSpy).not.toHaveBeenCalled();
      expect(removeSpy).not.toHaveBeenCalled();
      overlay.destroy();
    });

    test("a changed node only writes the attributes whose values differ", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [node(1, { role: SemanticRole.button, label: "Play" })],
      }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      const el = document.getElementById(semanticId(1))!;
      const setSpy = jest.spyOn(el, "setAttribute");
      const removeSpy = jest.spyOn(el, "removeAttribute");

      tree.applyDiff(diff({
        updatedSemantic: [node(1, { role: SemanticRole.button, label: "Pause" })],
      }));
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      // role/tabindex/etc. are unchanged and must not be rewritten; absent
      // attributes must not be redundantly removed.
      expect(setSpy.mock.calls.map((c) => c[0])).toEqual(["aria-label"]);
      expect(removeSpy).not.toHaveBeenCalled();
      overlay.destroy();
    });

    test("re-applies attributes everywhere after a missed update (version gap)", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [
          node(1, { role: SemanticRole.button, label: "Play", siblingIndex: 0 }),
          node(2, { role: SemanticRole.button, label: "Stop", siblingIndex: 1 }),
        ],
      }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      // Two diffs land before the next overlay update. The per-node change
      // set only describes the second one, so node 1's change would be lost
      // without the version-gap fallback.
      tree.applyDiff(diff({
        updatedSemantic: [node(1, { role: SemanticRole.button, label: "Pause", siblingIndex: 0 })],
      }));
      tree.applyDiff(diff({
        updatedSemantic: [node(2, { role: SemanticRole.button, label: "Halt", siblingIndex: 1 })],
      }));
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      expect(
        document.getElementById(semanticId(1))!.getAttribute("aria-label")
      ).toBe("Pause");
      expect(
        document.getElementById(semanticId(2))!.getAttribute("aria-label")
      ).toBe("Halt");
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Text geometry batching
  // ---------------------------------------------------------------------------

  describe("text geometry batching", () => {
    test("re-measures on a box-size change and skips when box and text are unchanged", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({
        added: [node(1, { role: SemanticRole.text, label: "Score", maxX: 100, maxY: 50 })],
      }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);

      const host = document.getElementById(semanticId(1))!;
      const span = host.querySelector(":scope > span") as HTMLElement;

      // jsdom rects are all zeros; substitute a 200x100 box holding text
      // whose natural size is 50x25 → the fit scale should be 4x4.
      const hostRect = jest.fn(() => ({ width: 200, height: 100 }) as DOMRect);
      const spanRect = jest.fn(() => ({ width: 50, height: 25 }) as DOMRect);
      host.getBoundingClientRect = hostRect;
      span.getBoundingClientRect = spanRect;

      // A bounds change invalidates the cached box-size|text key → re-measure.
      tree.applyDiff(diff({ updatedGeometry: [bounds(1, 0, 0, 200, 100)] }));
      overlay.update(tree, null, 1, defaultArtboardBounds);
      expect(span.style.transform).toBe("scale(4, 4)");
      expect(hostRect).toHaveBeenCalledTimes(1);
      expect(spanRect).toHaveBeenCalledTimes(1);

      // A semantic change elsewhere re-queues the text node during rebuild,
      // but its box and text are unchanged → no re-measure, transform kept.
      tree.applyDiff(diff({
        added: [node(2, { role: SemanticRole.text, label: "Other", siblingIndex: 1 })],
      }));
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      expect(hostRect).toHaveBeenCalledTimes(1);
      expect(spanRect).toHaveBeenCalledTimes(1);
      expect(span.style.transform).toBe("scale(4, 4)");
      overlay.destroy();
    });
  });

  // The overlay must only ever write .riv-supplied strings through non-parsing
  // sinks (textContent / setAttribute).
  describe("hostile content stays inert text", () => {
    const payload =
      '<img src=x onerror="window.__xss=true"><script>window.__xss=true</script>';

    function overlayWith(nodes: ReturnType<typeof node>[]) {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: nodes }));
      const overlay = createOverlay(canvas);
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      return overlay;
    }

    afterEach(() => {
      delete (window as any).__xss;
    });

    test("markup in a text node's label renders as inert text", () => {
      const overlay = overlayWith([
        node(1, { role: SemanticRole.text, label: payload }),
      ]);
      const span = document.getElementById(semanticId(1))!.querySelector("span")!;
      expect(span.textContent).toBe(payload);
      expect(document.querySelectorAll("img, script")).toHaveLength(0);
      expect((window as any).__xss).toBeUndefined();
      overlay.destroy();
    });

    test("markup in label, hint, and value never parses into elements", () => {
      const overlay = overlayWith([
        node(1, { role: SemanticRole.button, label: payload, hint: payload }),
        node(2, { role: SemanticRole.slider, label: "Volume", value: payload }),
      ]);

      const button = document.getElementById(semanticId(1))!;
      expect(button.getAttribute("aria-label")).toBe(payload);
      const descId = button.getAttribute("aria-describedby")!;
      expect(document.getElementById(descId)!.textContent).toBe(payload);

      const slider = document.getElementById(semanticId(2))!;
      expect(slider.getAttribute("aria-valuetext")).toBe(payload);
      // Non-numeric hostile value must not leak into aria-valuenow.
      expect(slider.getAttribute("aria-valuenow")).toBeNull();

      expect(document.querySelectorAll("img, script")).toHaveLength(0);
      expect((window as any).__xss).toBeUndefined();
      overlay.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Position drift detection (IntersectionObserver)
  // ---------------------------------------------------------------------------

  describe("canvas position drift detection", () => {
    beforeEach(() => {
      (window as any).innerWidth = 1000;
      (window as any).innerHeight = 800;
    });

    test("arms an IntersectionObserver framing the canvas", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      stubCanvasRect(canvas, { top: 100, left: 50, right: 250, bottom: 300 });

      const overlay = createOverlay(canvas);

      expect(intersectionObservers.length).toBe(1);
      const io = intersectionObservers[0];
      expect(io.observe).toHaveBeenCalledWith(canvas);
      expect(io.options?.threshold).toBe(1.0);
      // Negative insets from each viewport edge (1000x800) so the root box hugs
      // the canvas exactly: top -100, right -(1000-250), bottom -(800-300), left -50.
      expect(io.options?.rootMargin).toBe("-100px -750px -500px -50px");

      overlay.destroy();
    });

    test("does not arm when the canvas has zero area", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const overlay = createOverlay(canvas);
      expect(intersectionObservers.length).toBe(0);
      overlay.destroy();
    });

    test("ignores the initial notification and marks geometry dirty on a move", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      stubCanvasRect(canvas, { top: 100, left: 50, right: 250, bottom: 300 });

      const tree = new SemanticTreeModel();
      tree.applyDiff(diff({ added: [node(1, { role: SemanticRole.button, label: "Play" })] }));

      const overlay = createOverlay(canvas);
      // Baseline update syncs the transform and clears the initial dirty flag.
      overlay.update(tree, identityMat, 1, defaultArtboardBounds);
      expect(overlay.needsUpdate(tree)).toBeNull();

      const io = intersectionObservers[intersectionObservers.length - 1];

      // First callback is the observer's initial (contained) notification.
      io.fire();
      expect(overlay.needsUpdate(tree)).toBeNull();

      // A subsequent callback means the canvas moved.
      io.fire();
      expect(overlay.needsUpdate(tree)).toEqual({
        semanticChanged: false,
        nodeGeometryChanged: false,
        layoutChanged: true,
      });

      overlay.destroy();
    });

    test("re-arms the position observer after the reposition throttle", () => {
      jest.useFakeTimers();
      try {
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        stubCanvasRect(canvas, { top: 100, left: 50, right: 250, bottom: 300 });

        const overlay = createOverlay(canvas);
        expect(intersectionObservers.length).toBe(1);
        const first = intersectionObservers[0];

        first.fire(); // initial (ignored)
        first.fire(); // move → schedules a throttled reposition

        expect(first.disconnect).not.toHaveBeenCalled();
        jest.advanceTimersByTime(500);

        // The throttle fired: the old observer is torn down and a fresh one is
        // armed at the canvas's current location.
        expect(first.disconnect).toHaveBeenCalled();
        expect(intersectionObservers.length).toBe(2);
        expect(intersectionObservers[1].observe).toHaveBeenCalledWith(canvas);

        overlay.destroy();
      } finally {
        jest.useRealTimers();
      }
    });

    test("disconnects the position observer on destroy", () => {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      stubCanvasRect(canvas, { top: 100, left: 50, right: 250, bottom: 300 });

      const overlay = createOverlay(canvas);
      const io = intersectionObservers[0];
      overlay.destroy();
      expect(io.disconnect).toHaveBeenCalled();
    });
  });
});
