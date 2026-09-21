import * as rive from "../src/rive";
import { loopRiveFileBuffer } from "./assets/bytes";

let warnSpy: jest.SpyInstance;
let r: rive.Rive;

beforeAll((done) => {
  const canvas = document.createElement("canvas");
  r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onLoad: () => done(),
  });
});

afterAll(() => {
  r.cleanup();
});

beforeEach(() => {
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  rive.Rive.suppressDeprecationWarnings = [];
  jest.restoreAllMocks();
});

const warnings = () => warnSpy.mock.calls.map((call) => String(call[0]));

// `warnOnce` dedupes for the lifetime of the module, so each test below claims
// its own deprecation id rather than sharing one.
// #region deprecation warning suppression

test("suppressDeprecationWarnings defaults to empty", (): void => {
  expect(rive.Rive.suppressDeprecationWarnings).toEqual([]);
});

test("assigning replaces the whole list", (): void => {
  rive.Rive.suppressDeprecationWarnings = [
    rive.DeprecationKeys.riveEvents,
    rive.DeprecationKeys.textRuns,
  ];
  expect(rive.Rive.suppressDeprecationWarnings).toEqual([
    "rive-events",
    "text-runs",
  ]);

  rive.Rive.suppressDeprecationWarnings = [rive.DeprecationKeys.scrub];
  expect(rive.Rive.suppressDeprecationWarnings).toEqual(["scrub"]);
});

test("a warning is emitted once, tagged with the id needed to silence it", (): void => {
  rive.Layout.new({});
  rive.Layout.new({});

  const emitted = warnings().filter((message) =>
    message.includes("legacy-constructors"),
  );
  expect(emitted).toHaveLength(1);
  expect(emitted[0]).toContain("[Rive: legacy-constructors]");
  expect(emitted[0]).toContain(
    'Rive.suppressDeprecationWarnings = ["legacy-constructors"]',
  );
});

test("a suppressed id is not warned about", (): void => {
  rive.Rive.suppressDeprecationWarnings = [rive.DeprecationKeys.loopEvents];
  r.on(rive.EventType.Loop, () => {});
  r.on(rive.EventType.Loop, () => {});

  expect(warnSpy).not.toHaveBeenCalled();
});

test("suppressing one id leaves every other deprecation audible", (): void => {
  rive.Rive.suppressDeprecationWarnings = [rive.DeprecationKeys.riveEvents];
  r.on(rive.EventType.RiveEvent, () => {});
  r.on(rive.EventType.StateChange, () => {});

  const emitted = warnings();
  expect(emitted).toHaveLength(1);
  expect(emitted[0]).toContain("[Rive: state-change-events]");
});

test("un-suppressing an id logs it once, since it was never recorded", (): void => {
  // `rive-events` was suppressed, not emitted, by the previous test.
  rive.Rive.suppressDeprecationWarnings = [];
  r.on(rive.EventType.RiveEvent, () => {});

  const emitted = warnings().filter((message) =>
    message.includes("[Rive: rive-events]"),
  );
  expect(emitted).toHaveLength(1);
});

test("one id covers several messages, each reported once", (): void => {
  r.unsubscribe(rive.EventType.RiveEvent, () => {});
  r.unsubscribe(rive.EventType.RiveEvent, () => {});
  r.unsubscribeAll(rive.EventType.RiveEvent);

  const emitted = warnings().filter((message) =>
    message.includes("[Rive: legacy-unsubscribe]"),
  );
  expect(emitted).toHaveLength(2);
  expect(emitted[0]).toContain("`off()`");
  expect(emitted[1]).toContain("`removeAllRiveEventListeners()`");
});

test("an unknown id is ignored", (): void => {
  rive.Rive.suppressDeprecationWarnings = [
    "not-a-real-id" as rive.DeprecationId,
  ];

  expect(rive.Rive.suppressDeprecationWarnings).toEqual([]);
});

test("a non-array value is ignored with a warning", (): void => {
  rive.Rive.suppressDeprecationWarnings =
    true as unknown as rive.DeprecationId[];

  expect(rive.Rive.suppressDeprecationWarnings).toEqual([]);
  expect(warnings()[0]).toContain("expects an array of deprecation ids");
});

// #endregion
