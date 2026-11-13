import { WheelMomentumDetector } from "../src/utils/wheelMomentum";

// One verdict per delta, 60 events per second unless times are given.
const verdicts = (
  deltas: (number | [number, number])[],
  times: number[] = deltas.map((_, i) => 1000 + (i * 1000) / 60),
  detector = new WheelMomentumDetector(),
): boolean[] =>
  deltas.map((delta, i) => {
    const [deltaX, deltaY] = typeof delta === "number" ? [0, delta] : delta;
    const event = new WheelEvent("wheel", { deltaX, deltaY });
    Object.defineProperty(event, "timeStamp", { value: times[i] });
    return detector.isMomentum(event, deltaX, deltaY);
  });

const firstMomentum = (deltas: number[]) => verdicts(deltas).indexOf(true);

// Whole pixels with the remainder carried, as trackpads report.
const tail = (from: number, ratio: number): number[] => {
  const deltas: number[] = [];
  let carry = 0;
  for (let delta = from; delta >= 0.5; delta *= ratio) {
    const whole = Math.floor(delta + carry);
    carry = delta + carry - whole;
    if (whole > 0) {
      deltas.push(whole);
    }
  }
  return deltas;
};

test("a swipe turns to momentum soon after the fingers lift", (): void => {
  const fingers = [10, 24, 40, 56, 68, 76, 80, 80];
  const result = verdicts([...fingers, ...tail(80, 0.96)]);
  expect(result.slice(0, fingers.length)).not.toContain(true);
  const first = result.indexOf(true);
  expect(first).toBeGreaterThanOrEqual(fingers.length);
  expect(first).toBeLessThan(fingers.length + 8);
  expect(result.slice(first)).not.toContain(false);
});

test("momentum stays momentum through its one pixel end", (): void => {
  const result = verdicts(tail(20, 0.95));
  expect(result.slice(result.indexOf(true))).not.toContain(false);
  expect(result[result.length - 1]).toBe(true);
});

// Traces published with the events logged from real trackpads:
// https://dev.to/fanis71/solving-trackpad-navigation-the-hidden-challenge-of-irregular-delta-values-46a5
// https://dev.to/linards_liepenieks/building-custom-scroll-snap-sections-a-journey-through-mac-trackpad-hell-1k2k
test("two merged events do not end the momentum", (): void => {
  const result = verdicts([
    20, 19, 18, 17, 15, 13, 26, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 1,
  ]);
  const first = result.indexOf(true);
  expect(first).toBeLessThanOrEqual(5);
  expect(result.slice(first)).not.toContain(false);
});

test("a hard flick's uneven fall is momentum", (): void => {
  expect(firstMomentum([4, 132, 96, 94, 69, 57, 53, 49, 45])).toBe(5);
});

test("fingers at a steady speed are not momentum", (): void => {
  expect(verdicts([5, 5, 4, 5, 5, 4, 4, 5, 5, 4, 5])).not.toContain(true);
  expect(verdicts([30, 30, 29, 30, 31, 30, 29, 30, 30])).not.toContain(true);
});

test("fingers that speed up take the stream back", (): void => {
  const result = verdicts([40, 36, 32, 28, 24, 30, 38, 44]);
  expect(result).toEqual([false, false, false, true, true, true, false, false]);

  // A pixel more each event is still speeding up.
  expect(verdicts([40, 36, 32, 28, 24, 25, 26, 27, 28, 29, 30])).toEqual([
    false,
    false,
    false,
    true,
    true,
    true,
    true,
    false,
    false,
    false,
    false,
  ]);
});

test("a swipe that speeds up a pixel at a time keeps its peak", (): void => {
  const fingers = Array.from({ length: 27 }, (_, i) => 4 + i);
  const first = firstMomentum([...fingers, 30, 30, ...tail(30, 0.96)]);
  expect(first).toBeGreaterThanOrEqual(fingers.length + 2);
  expect(first).toBeLessThan(fingers.length + 12);
});

test("fingers that slow down and then hold a speed are not momentum for long", (): void => {
  const held = (size: number, events: number) =>
    verdicts([
      ...[1.5, 1.35, 1.2, 1.1].map((scale) => size * scale),
      ...Array(events).fill(size),
    ]);
  // 2500 / size ms: 4 events at 40 px an event, 15 at 10 px.
  expect(held(40, 12).slice(-6)).not.toContain(true);
  expect(held(10, 30).slice(-10)).not.toContain(true);
});

test.each([
  [40, 0.98, 60],
  [40, 0.985, 60],
  [80, 0.99, 60],
  [120, 0.95, 60],
  [80, Math.sqrt(0.99), 120],
  [40, Math.sqrt(0.96), 120],
])(
  "a tail from %d px falling to %d of itself, %d events a second, stays momentum",
  (from, ratio, rate): void => {
    const deltas = tail(from, ratio);
    const times = deltas.map((_, i) => 1000 + (i * 1000) / rate);
    const both = deltas.map((delta): [number, number] => [delta, delta]);
    for (const stream of [deltas, both]) {
      const result = verdicts(stream, times);
      expect(result).toContain(true);
      expect(result.slice(result.indexOf(true))).not.toContain(false);
    }
  },
);

test("a diagonal tail stays momentum as its larger axis changes", (): void => {
  const diagonal = tail(28, 0.96).map((delta, i): [number, number] =>
    i % 2 ? [delta, delta - 1] : [delta - 1, delta],
  );
  const result = verdicts(diagonal);
  expect(result.slice(result.indexOf(true))).not.toContain(false);
});

test("a pause or a turn starts a new gesture", (): void => {
  const fall = [40, 36, 32, 28, 24];
  const detector = new WheelMomentumDetector();
  expect(verdicts(fall, undefined, detector)[4]).toBe(true);
  // 101 ms after the last event, and still falling.
  expect(verdicts([20], [1000 + 4000 / 60 + 101], detector)).toEqual([false]);

  expect(verdicts([...fall, -20, -18, -16])).toEqual([
    false,
    false,
    false,
    true,
    true,
    false,
    false,
    false,
  ]);
});

test("a browser that reports momentum is taken at its word", (): void => {
  const detector = new WheelMomentumDetector();
  const reported = (deltaY: number, momentum: boolean) => {
    const event = new WheelEvent("wheel", { deltaY });
    Object.defineProperty(event, "momentum", { value: momentum });
    return detector.isMomentum(event, 0, deltaY);
  };
  expect([40, 36, 32, 28, 24].map((d) => reported(d, false))).not.toContain(
    true,
  );
  expect([10, 20, 30].map((d) => reported(d, true))).not.toContain(false);
});
