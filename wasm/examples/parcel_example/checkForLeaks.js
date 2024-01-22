export async function checkForLeaks(rive) {
  const riveEx = RIVE_EXAMPLES[0];
  const { hasStateMachine } = riveEx;
  var stateMachine, animation;
  const bytes = await (await fetch(new Request(riveEx.riveFile))).arrayBuffer();
  const file = await rive.load(new Uint8Array(bytes));
  const artboard = file.defaultArtboard();
  artboard.advance(0);
  if (hasStateMachine) {
    stateMachine = new rive.StateMachineInstance(
      artboard.stateMachineByIndex(0),
      artboard
    );
  } else {
    animation = new rive.LinearAnimationInstance(
      artboard.animationByName(riveEx.animation),
      artboard
    );
  }
  const num = 0;
  let canvas = document.getElementById(`canvas${num}`);
  if (!canvas) {
    const body = document.querySelector("body");
    canvas = document.createElement("canvas");
    canvas.id = `canvas${num}`;
    body.appendChild(canvas);
  }
  canvas.width = "400";
  canvas.height = "400";
  // Don't use the offscreen renderer for FF as it should have a context limit of 300
  const renderer = rive.makeRenderer(canvas, true);
  var elapsedSeconds = 0.0167;
  // Render 20 frames.
  for (var i = 0; i < 1000; i++) {
    renderer.clear();
    if (artboard) {
      if (stateMachine) {
        stateMachine.advance(elapsedSeconds);
      }
      if (animation) {
        animation.advance(elapsedSeconds);
        animation.apply(1);
      }
      artboard.advance(elapsedSeconds);
      renderer.save();
      renderer.align(
        rive.Fit.contain,
        rive.Alignment.center,
        {
          minX: 0,
          minY: 0,
          maxX: canvas.width,
          maxY: canvas.height,
        },
        artboard.bounds
      );
      artboard.draw(renderer);
      renderer.restore();
    }
    renderer.flush();
  }

  renderer.delete();
  if (stateMachine) {
    stateMachine.delete();
  }
  if (animation) {
    animation.delete();
  }
  if (artboard) {
    artboard.delete();
  }
  file.delete();
  rive.cleanup();
  // Report any leaks.
  rive.doLeakCheck();
  console.log("END");
}
