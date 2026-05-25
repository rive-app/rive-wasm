window.AudioContext = jest.fn().mockImplementation(() => {
  return {};
});

// jsdom doesn't ship a ResizeObserver. Provide one that captures the per-target
// callback so tests can fire synthetic entries through the same code path the
// browser would use.
const resizeObserverCallbacks = new Map<Element, ResizeObserverCallback>();

class TestResizeObserver implements ResizeObserver {
  private readonly targets = new Set<Element>();
  constructor(private readonly callback: ResizeObserverCallback) {}
  public observe(target: Element): void {
    this.targets.add(target);
    resizeObserverCallbacks.set(target, this.callback);
  }
  public unobserve(target: Element): void {
    this.targets.delete(target);
    resizeObserverCallbacks.delete(target);
  }
  public disconnect(): void {
    for (const target of this.targets) {
      resizeObserverCallbacks.delete(target);
    }
    this.targets.clear();
  }
}

(globalThis as any).ResizeObserver = TestResizeObserver;

// Test helper: trigger the ResizeObserver callback registered for the given
// target with a synthetic entry of the supplied dimensions.
(globalThis as any).__fireResizeObserver = (
  target: Element,
  width: number,
  height: number,
): void => {
  const callback = resizeObserverCallbacks.get(target);
  if (!callback) return;
  const entry = {
    target,
    contentRect: { width, height } as DOMRectReadOnly,
  } as ResizeObserverEntry;
  callback([entry], {} as ResizeObserver);
};
