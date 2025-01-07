import "regenerator-runtime";
import { Rive, Fit, Alignment, Layout } from "@rive-app/canvas";

const RiveLayoutTest = new URL("/assets/layout_test.riv", import.meta.url);

async function loadRiveFile() {
  return await (await fetch(new Request(RiveLayoutTest))).arrayBuffer();
}

async function main() {
  setup();
}

const riveCanvas = document.getElementById("riveCanvas") as HTMLCanvasElement;

async function setup() {
  const bytes = await loadRiveFile();

  const rive = new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: riveCanvas,
    layout: new Layout({
      fit: Fit.Layout,
      alignment: Alignment.Center,
      // layoutScaleFactor: 2, // 2x scale of the layout, when using `Fit.Layout`. This allows you to resize the layout as needed.
    }),
    stateMachines: ["State Machine 1"],
    onLoad: () => {
      computeSize();
    },
  });

  function computeSize() {
    rive.resizeDrawingSurfaceToCanvas();
  }

  window.onresize = computeSize;

  window
    .matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    .addEventListener("change", computeSize);
}

main();
