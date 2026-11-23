import * as rive from "../src/rive";
import { pingPongRiveFileBuffer } from "./assets/bytes";
import { loadFile, loadRive } from "./helpers";

describe("semantics mode", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("Disabled (default) leaves semantics off on the runtime state machines", async () => {
    const semanticDataBindingListsBuffer = loadFile(
      "assets/data_binding_lists.riv",
    );
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const r = await loadRive({
      canvas,
      buffer: semanticDataBindingListsBuffer,
      stateMachines: "State Machine 1",
    });
    // @ts-expect-error private activation flag for test
    expect(r._semanticsActive).toBe(false);

    // @ts-expect-error private animator access for test
    const stateMachines = r.animator.stateMachines;
    expect(stateMachines.length).toBeGreaterThan(0);

    // The runtime side really has semantics disabled: draining yields no
    // diff (not merely a JS-side flag being false).
    for (const sm of stateMachines) {
      expect(sm.drainSemanticsDiff()).toBeNull();
    }
    r.cleanup();
  });

  test("enableSemantics() activates and propagates to the runtime state machines", async () => {
    const semanticDataBindingListsBuffer = loadFile(
      "assets/data_binding_lists.riv",
    );
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const r = await loadRive({
      canvas,
      buffer: semanticDataBindingListsBuffer,
      stateMachines: "State Machine 1",
    });
    // @ts-expect-error private animator access for test
    const stateMachines = r.animator.stateMachines;
    expect(stateMachines.length).toBeGreaterThan(0);

    // Spy before enabling so we can prove activation reaches each state
    // machine wrapper, not just that a JS flag flips.
    const spies = stateMachines.map((sm: { enableSemantics: () => void }) =>
      jest.spyOn(sm, "enableSemantics")
    );

    r.enableSemantics();

    // @ts-expect-error private activation flag for test
    expect(r._semanticsActive).toBe(true);
    for (const spy of spies) {
      expect(spy).toHaveBeenCalledTimes(1);
    }
    r.cleanup();
  });

  test("Enabled mode activates semantics after load", async () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const r = await loadRive({
      canvas,
      buffer: pingPongRiveFileBuffer,
      semanticsMode: rive.SemanticMode.Enabled,
    });
    // @ts-expect-error private activation flag for test
    expect(r._semanticsActive).toBe(true);
    r.cleanup();
  });
});
