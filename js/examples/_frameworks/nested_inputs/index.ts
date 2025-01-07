import "regenerator-runtime";
import { Rive, Fit, Alignment, Layout } from "@rive-app/canvas";
// import { Rive, Fit, Alignment, Layout } from "@rive-app/webgl";

const RiveNestedInputs = new URL(
  "/assets/runtime_nested_inputs.riv",
  import.meta.url,
);

async function loadRiveFile() {
  return await (await fetch(new Request(RiveNestedInputs))).arrayBuffer();
}

async function main() {
  setup();
}

async function setup() {
  const bytes = await loadRiveFile();
  const riveCanvas = document.getElementById("riveCanvas") as HTMLCanvasElement;

  const rive = new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: riveCanvas,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    stateMachines: ["MainStateMachine"],
  });

  // Register buttons
  document.getElementById("outerCircleOn")!.onclick = function () {
    rive?.setBooleanStateAtPath("CircleOuterState", true, "CircleOuter");
  };
  document.getElementById("outerCircleOff")!.onclick = function () {
    rive?.setBooleanStateAtPath("CircleOuterState", false, "CircleOuter");
  };
  document.getElementById("innerCircleOn")!.onclick = function () {
    rive?.setBooleanStateAtPath(
      "CircleInnerState",
      true,
      "CircleOuter/CircleInner",
    );
  };
  document.getElementById("innerCircleOff")!.onclick = function () {
    rive?.setBooleanStateAtPath(
      "CircleInnerState",
      false,
      "CircleOuter/CircleInner",
    );
  };
}

main();
