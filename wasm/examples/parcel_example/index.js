import "regenerator-runtime";
// (Debug) Canvas Advanced Single
// import RiveCanvas from "../../build/bin/debug/canvas_advanced_single.mjs";

// (Debug) Canvas Advanced
// import RiveCanvas from "../../build/bin/debug/canvas_advanced.mjs";

// (Release) WebGL Advanced Single
// import RiveCanvas from "../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs";

// (Release) Canvas Advanced Single
import RiveCanvas from "../../../js/npm/canvas_advanced_single/canvas_advanced_single.mjs";

// (Release) Canvas Advanced Single Lite
// import RiveCanvas from "../../build/canvas_advanced_lite_single/bin/release/canvas_advanced_single.mjs";

// import {checkForLeaks} from "./checkForLeaks";

import AvatarAnimation from "./look.riv";
import TapeMeshAnimation from "./tape.riv";
import BirdAnimation from "./birb.riv";
import TruckAnimation from "./truck.riv";
import BallAnimation from "./ball.riv";
import SwitchAnimation from "./switch_event_example.riv";
import TestText from "./text_test_2.riv";
import "./main.css";

const RIVE_EXAMPLES = {
  0: {
    riveFile: BallAnimation,
    hasStateMachine: true,
    stateMachine: "Main State Machine",
  },
  1: {
    riveFile: TapeMeshAnimation,
    animation: "Animation 1",
  },
  2: {
    riveFile: SwitchAnimation,
    hasStateMachine: true,
    stateMachine: "Main State Machine",
  },
  3: {
    riveFile: BirdAnimation,
    animation: "idle",
  },
  4: {
    riveFile: TruckAnimation,
    hasStateMachine: true,
    stateMachine: "drive",
  },
  5: {
    riveFile: AvatarAnimation,
    animation: "idle",
  },
  6: {
    riveFile: TestText,
    hasStateMachine: true,
    stateMachine: "State Machine 1",
  },
};

// Load in the Rive File, retrieve the default artboard, a named state machine, or a named animation
async function retrieveRiveContents({ rive, num }) {
  async function loadDefault() {
    const riveEx = RIVE_EXAMPLES[num % Object.keys(RIVE_EXAMPLES).length];
    const { hasStateMachine } = riveEx;
    const bytes = await (
      await fetch(new Request(riveEx.riveFile))
    ).arrayBuffer();
    const file = await rive.load(new Uint8Array(bytes));
    artboard = file.defaultArtboard();
    if (hasStateMachine) {
      stateMachine = new rive.StateMachineInstance(
        artboard.stateMachineByName(riveEx.stateMachine),
        artboard
      );
    } else {
      animation = new rive.LinearAnimationInstance(
        artboard.animationByName(riveEx.animation),
        artboard
      );
    }
  }
  await loadDefault();

  let artboard, stateMachine, animation;

  return { artboard, stateMachine, animation };
}

async function main() {
  // Determine how many Rives to load and draw onto the singular canvas
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const numRivesToRender = parseInt(params.numCanvases || 0) || 20;

  // Set canvas surface area based on the amount of rivs to render
  // To keep this simple, we'll just render each Rive with an area
  // of 250x250
  let canvas = document.getElementById("rive-canvas");
  canvas.width = `${numRivesToRender * 250}`;
  canvas.height = `${Math.ceil(numRivesToRender / 4) * 250}`;

  // Instance Rive and create our Renderer
  // Note: We use the advanced-single build here to simplify having to load in WASM, as
  // this will ensure WASM is bundled in the JS
  const rive = await RiveCanvas();
  const renderer = rive.makeRenderer(canvas, true);

  // OPTIONAL FOR DEBUG TESTING: Perform leak checks right after rive is initialized.
  // await checkForLeaks(rive);

  // Track the artboard, animation/state machine of each Rive file we load in
  let instances = [];
  for (let i = 0; i < numRivesToRender; i++) {
    instances.push(await retrieveRiveContents({ rive, num: i }));
  }

  let lastTime = 0;
  function draw(time) {
    if (!lastTime) {
      lastTime = time;
    }
    const elapsedMs = time - lastTime;
    const elapsedSeconds = elapsedMs / 1000;
    lastTime = time;

    renderer.clear();
    let trackX = 0;
    let trackY = 0;
    const colMax = 4;

    // For each Rive we loaded, advance the animation/state machine and artboard by elapsed
    // time since last frame draw and render the Artboard to a piece of the canvas using
    // the Renderer's align method
    for (let i = 0; i < numRivesToRender; i++) {
      let { artboard, stateMachine, animation } = instances[i];
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
        // Draw to a 250x250 piece of the canvas and track "position"
        // in grid to move to the next piece to render the next Rive
        renderer.align(
          rive.Fit.contain,
          rive.Alignment.center,
          {
            minX: trackX,
            minY: trackY,
            maxX: trackX + 250,
            maxY: trackY + 250,
          },
          artboard.bounds
        );
        if ((i + 1) % colMax === 0) {
          trackX = 0;
          trackY += 250;
        } else {
          trackX += 250;
        }

        // Pass along our Renderer to the artboard, so that it can draw onto the canvas
        artboard.draw(renderer);
        renderer.restore();
      }
    }

    renderer.flush();

    // Needed to actually resolve a queue of drawing and rendering calls with our Renderer
    // Note: ONLY needed if using a normal JS requestAnimationFrame, rather than our wrapped
    // one in the rive API
    // rive.resolveAnimationFrame();

    // Call the next frame!
    rive.requestAnimationFrame(draw);
  }
  // Start the animation loop
  rive.requestAnimationFrame(draw);
}

main();
