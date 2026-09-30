import { canvasOffset } from "./canvasOffset";

// 16px: the smallest font size at which iOS Safari doesn't zoom on focus
const FONT_SIZE_PX = 16;

export interface TextInputProxyParams {
  /** Where to mount the proxy — the canvas's parent so it scrolls/positions with it. */
  container: HTMLElement;
  /** The Rive canvas, used to position the proxy over it (iOS scroll-jump avoidance) and for domain checks. */
  canvas: HTMLElement;
  /** Forward committed text (typing, IME/dead-key commits, paste) into the focus tree. */
  textInput: (text: string) => boolean;
  /** Physical key events on the proxy route back through KeyboardInteractions' shared policy. */
  onKeyDown: (event: KeyboardEvent) => void;
  onKeyUp: (event: KeyboardEvent) => void;
  /** The field is empty; fill the clipboard from Rive's selection. */
  onCopy: (event: ClipboardEvent) => void;
  /** Called when the proxy loses DOM focus; the receiver decides whether to tear the session down. */
  onBlur: (relatedTarget: EventTarget | null) => void;
}

/** Capture-critical attributes decorate() must not touch. */
const PROTECTED_ATTRS = new Set<string>([
  "type",
  "value",
  "style",
  "tabindex",
  "autocapitalize",
  "autocomplete",
  "autocorrect",
  "spellcheck",
]);

/**
 * Invisible per-instance <input> capturing IME/dead-key/paste text; focusable inside a
 * gesture to raise mobile keyboards. Always empty: C++ owns value and caret. Decorated
 * for AT only while it holds DOM focus.
 */
export class TextInputProxy {
  private params: TextInputProxyParams;
  private element: HTMLInputElement;
  // True between compositionstart/compositionend; we never commit mid-composition.
  private composing = false;
  // Names set by decorate(), removed by resetDecoration().
  private decoratedKeys = new Set<string>();
  // Last written left/top, to skip no-op style writes.
  private lastLeft = NaN;
  private lastTop = NaN;

  constructor(params: TextInputProxyParams) {
    this.params = params;
    this.element = this.createElement();
    this.positionOverCanvas();
    // Order vs. the overlay is unspecified; fine, Tab release starts from the canvas.
    this.params.container.appendChild(this.element);
  }

  // Registered first so it runs before the key handler inserts or moves the caret.
  private listeners(): [string, EventListener][] {
    return [
      ["keydown", this.reposition],
      ["beforeinput", this.reposition],
      ["keydown", this.params.onKeyDown as EventListener],
      ["keyup", this.params.onKeyUp as EventListener],
      ["input", this.onInput],
      ["compositionstart", this.onCompositionStart],
      ["compositionend", this.onCompositionEnd],
      ["paste", this.onPaste as EventListener],
      ["copy", this.params.onCopy as EventListener],
      ["blur", this.onBlur as EventListener],
    ];
  }

  private createElement(): HTMLInputElement {
    const el = document.createElement("input");
    el.type = "text";
    // Focusable but never in native tab order (Rive drives traversal synthetically),
    // and invisible without display:none (which would forbid focus).
    el.tabIndex = -1;
    el.setAttribute("aria-hidden", "true");
    // Always empty, so autocapitalize/autocorrect would misfire.
    el.setAttribute("autocapitalize", "off");
    el.setAttribute("autocomplete", "off");
    el.setAttribute("autocorrect", "off");
    el.spellcheck = false;
    // Over the canvas (not display:none) so iOS doesn't scroll-jump on keyboard open.
    // font-size must stay 16px or iOS Safari zooms on focus.
    el.style.cssText =
      "position:absolute;width:1px;height:1px;padding:0;margin:0;border:0;" +
      "outline:none;opacity:0;background:transparent;color:transparent;" +
      "caret-color:transparent;overflow:hidden;resize:none;z-index:0;" +
      // Focused programmatically only; must not swallow clicks
      "pointer-events:none;" +
      `font-size:${FONT_SIZE_PX}px;line-height:1;`;
    for (const [type, listener] of this.listeners()) el.addEventListener(type, listener);
    return el;
  }

  private positionOverCanvas(): void {
    // Track the canvas (browsers scroll to the caret); clamp on-screen, one caret line box
    // (FONT_SIZE_PX) from the far edges, or the root scrolls to reveal it.
    let { top, left } = canvasOffset(this.params.canvas);
    if (window.innerHeight > 0) {
      const r = this.params.canvas.getBoundingClientRect();
      top += clamp(r.top, 0, window.innerHeight - FONT_SIZE_PX) - r.top;
      left += clamp(r.left, 0, window.innerWidth - FONT_SIZE_PX) - r.left;
    }
    if (left !== this.lastLeft) {
      this.element.style.left = `${left}px`;
      this.lastLeft = left;
    }
    if (top !== this.lastTop) {
      this.element.style.top = `${top}px`;
      this.lastTop = top;
    }
  }

  /** Re-sync before input: the canvas may have scrolled since the session began. */
  private reposition = () => this.positionOverCanvas();

  private onCompositionStart = () => {
    this.composing = true;
  };

  private onCompositionEnd = () => {
    this.composing = false;
    // The composed text is now committed in element.value; forward it here. A
    // trailing `input` event (order varies by browser) then sees an empty field.
    this.commit();
  };

  private onInput = () => {
    if (this.composing) return;
    this.commit();
  };

  /** 
   * Forward the field's text to Rive and clear it. 
   * 
   * TODO: iOS won't autorepeat Backspace in an empty field (needs a text mirror).
   * */
  private commit(): void {
    const text = this.element.value;
    if (!text) return;
    this.element.value = "";
    this.params.textInput(text);
  }

  // An <input type=text> strips line breaks from its value, so forward the clipboard
  // text directly. Core's single-line fields strip them themselves.
  private onPaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData("text/plain");
    if (!text) return;
    event.preventDefault();
    this.params.textInput(text.replace(/\r\n?/g, "\n"));
  };

  private onBlur = (event: FocusEvent) => {
    this.params.onBlur(event.relatedTarget);
  };

  /** Clear any transient value and decoration. Does not blur the element. */
  endSession(): void {
    this.element.value = "";
    // Browsers fire compositionend on blur, but a stuck flag would drop every
    // keystroke of the next session.
    this.composing = false;
    // Also covers blur-out, which bypasses the overlay.
    this.resetDecoration();
  }

  /** Must be called synchronously inside a gesture on iOS to raise the keyboard. */
  focus(): void {
    // Reposition first: iOS scrolls the focused input into view when the keyboard opens.
    this.positionOverCanvas();
    this.element.focus({ preventScroll: true });
  }

  hasDomFocus(): boolean {
    return document.activeElement === this.element;
  }

  owns(target: EventTarget | null): boolean {
    return target === this.element;
  }

  /** See EditingHost.decorate. */
  decorate(attrs: Record<string, string | null>): void {
    // aria-hidden outranks every attribute set below, so it must come off before this
    // element can stand in as the accessible element for the focused node.
    this.element.removeAttribute("aria-hidden");
    for (const [name, value] of Object.entries(attrs)) {
      // Never override capture attrs.
      if (PROTECTED_ATTRS.has(name.toLowerCase())) continue;
      if (value === null) {
        this.element.removeAttribute(name);
        this.decoratedKeys.delete(name);
      } else {
        // Skip no-op writes: setting an attribute to the value it already has still
        // emits a mutation, and assistive tech is focused on this element mid-edit.
        if (this.element.getAttribute(name) !== value) {
          this.element.setAttribute(name, value);
        }
        this.decoratedKeys.add(name);
      }
    }
  }

  /**
   * type=password for obscured fields so AT doesn't echo keys.
   * TODO: source "type" from Core, not semantics.
   */
  setSecure(secure: boolean): void {
    const type = secure ? "password" : "text";
    if (this.element.type !== type) this.element.type = type;
  }

  /** Drop all decoration and return to the AT-invisible baseline. */
  resetDecoration(): void {
    this.setSecure(false);
    this.decoratedKeys.forEach((name) => this.element.removeAttribute(name));
    this.decoratedKeys.clear();
    this.element.setAttribute("aria-hidden", "true");
  }

  cleanup(): void {
    for (const [type, listener] of this.listeners()) {
      this.element.removeEventListener(type, listener);
    }
    this.element.remove();
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), Math.max(min, max));
}
