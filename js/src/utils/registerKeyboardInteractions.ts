import * as rc from "../rive_advanced.mjs";

export interface KeyboardInteractionsParams {
  canvas: HTMLCanvasElement;
  stateMachine: rc.StateMachineInstance;
  /**
   * Whether this canvas has focus nodes that should participate in tab traversal.
   * When true, Tab/Shift+Tab will be intercepted and routed to the Rive focus manager.
   * focusNext() returning false means no more traversable nodes — tab is released to the page.
   */
  hasFocusNodes: boolean;
}

/**
 * Tracks the relationship between the canvas's DOM focus and Rive's internal focus for the
 * current focus session.
 *
 * NotFocused   — the canvas is not the active DOM element, or Rive entered and then released focus
 *                internally this session. Either way the next Tab should move on to the next page
 *                element, so Tab events are ignored.
 * EntryPending — the canvas has DOM focus but Rive holds no active focus node yet, and the next Tab should enter
 *                the focus tree. This is the resting state for pointer-driven focus (a click on the
 *                canvas), or an edge case for keyboard focus where initial focus action did not land on a focus node. 
 * RiveFocused  — a Rive node currently holds focus. Tab/Shift+Tab are routed to the Rive focus
 *                manager and trapped inside the canvas until Rive notifies focus has ended.
 *
 * When keyboard focus lands on the canvas, onCanvasFocus reads the direction focus came from and 
 * moves into the focus tree immediately, going straight to RiveFocused. EntryPending is only set via pointer focus (or keyboard focus
 * where focusNext()/focusPrevious() return false but respects tabindex).
 */
export enum FocusSessionState {
  NotFocused = "notFocused",
  EntryPending = "entryPending",
  RiveFocused = "riveFocused",
}

/**
 * Manages keyboard and DOM focus interactions for a Rive canvas.
 *
 * Tracks the canvas focus session state (focusSessionState) and routes
 * Tab/Shift+Tab to the Rive state machine's focus manager. Exposes shared
 * state as properties so the Rive render loop can read them directly.
 */
export class KeyboardInteractions {
  public focusSessionState: FocusSessionState = FocusSessionState.NotFocused;

  private canvas: HTMLCanvasElement;
  private mainSm: rc.StateMachineInstance;
  private hasFocusNodes: boolean;

  constructor({ canvas, stateMachine, hasFocusNodes }: KeyboardInteractionsParams) {
    this.canvas = canvas;
    this.mainSm = stateMachine;
    this.hasFocusNodes = hasFocusNodes;

    canvas.addEventListener("focus", this.onCanvasFocus);
    canvas.addEventListener("blur", this.onCanvasBlur);
    canvas.addEventListener("keydown", this.onKeyDown);
  }

  /**
   * Set the FocusSessionState. Useful for invoking a Rive "blur" without actually blurring from the <canvas>. This
   * helps put the DOM focus state on the canvas rather than the <body>, so the user doesn't lose the spot in page navigation
   *
   * @param state FocusSessionState enum
   */
  public setFocusSessionState(state: FocusSessionState): void {
    this.focusSessionState = state;
  }

  /**
   * Called by pollFocusState on the Rive instance when it observes hasFocus=true. Rive acquired
   * focus internally (e.g. via a listener action or state transition) without a DOM focus event,
   * so mark the session RiveFocused.
   */
  public notifyRiveFocused(): void {
    this.focusSessionState = FocusSessionState.RiveFocused;
  }

  /**
   * Handles the canvas gaining browser focus. The behavior differs based on how focus was gained -
   *
   * Pointer-driven focus: the canvas now has focus but Rive holds nothing yet, so we move to EntryPending — this lets the
   * next Tab enter the focus tree even when the focus is pointer-driven
   *
   * Keyboard-driven focus: we enter the Rive focus tree immediately once canvas gains focus.
   * The direction is inferred from where focus came from: an element before the canvas in DOM order
   * means a forward Tab (focusNext), one after means a Shift+Tab (focusPrevious). :focus-visible
   * gates this so a click doesn't yank Rive focus to the first node on the focus event itself.
   */
  public onCanvasFocus = (event: FocusEvent) => {
    if (!this.hasFocusNodes) return;
    if (this.mainSm.focusState().hasFocus) return;

    this.focusSessionState = FocusSessionState.EntryPending;

    // Pointer focus waits for the user's next Tab (handled in onKeyDown). Keyboard focus enters now.
    if (!this.isKeyboardDrivenFocus()) return;
    const forward = this.cameFromBeforeCanvas(event.relatedTarget as Node | null);
    if (forward ? this.mainSm.focusNext() : this.mainSm.focusPrevious()) {
      this.focusSessionState = FocusSessionState.RiveFocused;
    }
  };

  public onCanvasBlur = (_event: FocusEvent) => {
    this.focusSessionState = FocusSessionState.NotFocused;
  };

  public onKeyDown = (event: KeyboardEvent) => {
    if (this.focusSessionState === FocusSessionState.NotFocused) return;

    if (event.code === "Tab" && this.hasFocusNodes) {
      const forward = !event.shiftKey;
      const focusMoved = forward ? this.mainSm.focusNext() : this.mainSm.focusPrevious();
      if (focusMoved) {
        // A Rive node accepted focus — keep trapping Tab inside the canvas.
        this.focusSessionState = FocusSessionState.RiveFocused;
        event.preventDefault();
      } else {
        // No more traversable nodes — release Tab to the page.
        // Set state immediately; onCanvasBlur will also fire naturally.
        this.focusSessionState = FocusSessionState.NotFocused;
      }
    }
  };

  /**
   * Whether the canvas currently matches :focus-visible — the browser's heuristic for keyboard-
   * (vs pointer-) driven focus. For older browser versions that don't support this selector, return false
   * so that we don't incorrectly assume pointer vs keyboard focus. Next tab would enter the focus tree in those edge cases.
   */
  private isKeyboardDrivenFocus(): boolean {
    try {
      return this.canvas.matches(":focus-visible");
    } catch {
      return false;
    }
  }

  private cameFromBeforeCanvas(from: Node | null): boolean {
    if (!from) return true;
    const position = this.canvas.compareDocumentPosition(from);
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return true;
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return false;
    return true;
  }

  public cleanup(): void {
    this.canvas.removeEventListener("focus", this.onCanvasFocus);
    this.canvas.removeEventListener("blur", this.onCanvasBlur);
    this.canvas.removeEventListener("keydown", this.onKeyDown);
  }
}
