import "regenerator-runtime";
import { Rive, Fit, Alignment, Layout } from "@rive-app/canvas";

const RiveNestedTextRuns = new URL(
  "/assets/runtime_nested_text_runs.riv",
  import.meta.url,
);

async function loadRiveFile() {
  return await (await fetch(new Request(RiveNestedTextRuns))).arrayBuffer();
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
    stateMachines: ["State Machine 1"],
    onLoad: () => {
      rive.resizeDrawingSurfaceToCanvas();
    },
  });

  // Register buttons
  document.getElementById("set_b1")!.onclick = function () {
    rive?.setTextRunValueAtPath(
      "ArtboardBRun",
      "ArtboardB-1 Updated",
      "ArtboardB-1",
    );
  };
  document.getElementById("set_b2")!.onclick = function () {
    rive?.setTextRunValueAtPath(
      "ArtboardBRun",
      "ArtboardB-2 Updated",
      "ArtboardB-2",
    );
  };
  document.getElementById("set_b1_c1")!.onclick = function () {
    rive?.setTextRunValueAtPath(
      "ArtboardCRun",
      "ArtboardB1-C1 Updated",
      "ArtboardB-1/ArtboardC-1",
    );
  };
  document.getElementById("set_b1_c2")!.onclick = function () {
    rive?.setTextRunValueAtPath(
      "ArtboardCRun",
      "ArtboardB1-C2 Updated",
      "ArtboardB-1/ArtboardC-2",
    );
  };
  document.getElementById("set_b2_c1")!.onclick = function () {
    rive?.setTextRunValueAtPath(
      "ArtboardCRun",
      "ArtboardB2-C1 Updated",
      "ArtboardB-2/ArtboardC-1",
    );
  };
  document.getElementById("set_b2_c2")!.onclick = function () {
    rive?.setTextRunValueAtPath(
      "ArtboardCRun",
      "ArtboardB2-C2 Updated",
      "ArtboardB-2/ArtboardC-2",
    );
  };
}

main();
