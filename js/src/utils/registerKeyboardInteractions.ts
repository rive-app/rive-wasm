import * as rc from "../rive_advanced.mjs";

export interface KeyboardInteractionsParams {
  canvas: HTMLCanvasElement;
  stateMachine: rc.StateMachineInstance;
  rive: rc.RiveCanvas;
  /**
   * Whether this canvas has focus nodes that should participate in tab traversal.
   * When true, Tab/Shift+Tab will be intercepted and routed to the Rive focus manager.
   * focusNext() returning false means no more traversable nodes — tab is released to the page.
   */
  hasFocusNodes: boolean;
}

/**
 * Registers focus and tab-traversal event handlers on the canvas to route
 * Tab/Shift+Tab to the active Rive state machine's focus manager.
 *
 * Mirrors registerTouchInteractions for pointer events.
 *
 * Returns a cleanup function that removes all registered event listeners,
 * or null if the setup conditions are not met.
 */
export const registerKeyboardInteractions = ({
  canvas,
  stateMachine,
  rive,
  hasFocusNodes,
}: KeyboardInteractionsParams): (() => void) | null => {
  if (
    !canvas ||
    !stateMachine ||
    !rive ||
    typeof window === "undefined"
  ) {
    return null;
  }

  // Work off an assumption of a single state machine
  const mainSm = stateMachine;
  let canvasHasFocus = false;

  const onCanvasFocus = (_event: FocusEvent) => {
    canvasHasFocus = true;
  };

  const onCanvasBlur = (_event: FocusEvent) => {
    canvasHasFocus = false;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!canvasHasFocus) return;

    if (event.code === "Tab" && hasFocusNodes) {
      const forward = !event.shiftKey;
      const focusMoved = forward ? mainSm.focusNext() : mainSm.focusPrevious();
      if (focusMoved) {
        // Keep Tab inside the canvas — a Rive node received focus.
        event.preventDefault();
      } else {
        // No more traversable nodes — release Tab to the page.
        // Since we're not preventing default, blur event will fire on the canvas
        canvasHasFocus = false;
      }
    }
  };

  canvas.addEventListener("focus", onCanvasFocus);
  canvas.addEventListener("blur", onCanvasBlur);
  canvas.addEventListener("keydown", onKeyDown);

  return () => {
    canvas.removeEventListener("focus", onCanvasFocus);
    canvas.removeEventListener("blur", onCanvasBlur);
    canvas.removeEventListener("keydown", onKeyDown);
  };
};
