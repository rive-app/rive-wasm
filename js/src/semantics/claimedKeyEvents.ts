const claimed = new WeakSet<Event>();

/**
 * Marks a key event as handled by a semantic overlay widget (and prevents its
 * default), so the Rive keyboard handler leaves it alone. A plain
 * `defaultPrevented` check can't tell these apart from host-page handlers.
 */
export function claimKeyEvent(event: Event): void {
  event.preventDefault();
  claimed.add(event);
}

export function isKeyEventClaimed(event: Event): boolean {
  return claimed.has(event);
}
