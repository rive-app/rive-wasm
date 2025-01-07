import Rive from "../../../js/npm/canvas_advanced_single/canvas_advanced_single.mjs";
// import Rive from "../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs";

const LayoutRivFile = new URL("./layout_test.riv", import.meta.url);

let lastTime: number;

async function main() {
  // Initialize Rive and load file
  const rive = await Rive();
  const fileBytes = new Uint8Array(
    await (await fetch(new Request(LayoutRivFile))).arrayBuffer()
  );
  const file = await rive.load(fileBytes);
  const artboard = file.defaultArtboard();
  const stateMachine = new rive.StateMachineInstance(
    artboard.stateMachineByIndex(0),
    artboard
  );
  const canvas = document.getElementById("rive-canvas") as HTMLCanvasElement;
  const renderer = rive.makeRenderer(canvas, false);

  // Configuration
  let scaleFactor: number;
  const fit = rive.Fit.layout;

  // Helper to update the size of the canvas to fit the window.
  function getLayoutScaleFactor(): number {
    if (typeof window !== "undefined" && window.devicePixelRatio) {
      return window.devicePixelRatio;
    }
    return 1;
  }

  function computeSize() {
    scaleFactor = getLayoutScaleFactor();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // Update canvas dimensions
    canvas.width = viewportWidth * scaleFactor;
    canvas.height = viewportHeight * scaleFactor;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;

    if (artboard && fit === rive.Fit.layout) {
      artboard.width = viewportWidth;
      artboard.height = viewportHeight;
    }

    // You can call `resetArtboardSize()` to reset to the original size.
    // artboard.resetArtboardSize();

    requestAnimationFrame(draw);
  }

  function draw(time: number) {
    if (!renderer || !artboard || !stateMachine) return;

    // Handle timing
    if (!lastTime) lastTime = time;
    const elapsedSeconds = (time - lastTime) / 1000;
    lastTime = time;

    // Render frame
    renderer.clear();

    const shouldContinue =
      stateMachine.advance(elapsedSeconds) && artboard.advance(elapsedSeconds);

    renderer.save();
    renderer.align(
      rive.Fit.layout,
      rive.Alignment.center,
      {
        minX: 0,
        minY: 0,
        maxX: canvas.width,
        maxY: canvas.height,
      },
      artboard.bounds,
      scaleFactor
    );

    artboard.draw(renderer);
    renderer.restore();
    renderer.flush();

    if (shouldContinue) {
      requestAnimationFrame(draw);
    }
    rive.resolveAnimationFrame();
  }

  // Event listeners
  window.onresize = computeSize;
  window
    .matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    .addEventListener("change", computeSize);

  // Start animation
  computeSize();
  requestAnimationFrame(draw);
}

main();
