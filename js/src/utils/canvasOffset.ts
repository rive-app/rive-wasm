/**
 * Canvas offset within its offsetParent, minus the scroll of ancestors in between (they
 * move the canvas, not absolutely positioned siblings).
 */
export function canvasOffset(canvas: HTMLElement): { top: number; left: number } {
  let top = canvas.offsetTop;
  let left = canvas.offsetLeft;
  const offsetParent = canvas.offsetParent;
  if (!offsetParent) return { top, left };
  for (let el = canvas.parentElement; el && el !== offsetParent; el = el.parentElement) {
    top -= el.scrollTop;
    left -= el.scrollLeft;
  }
  return { top, left };
}
