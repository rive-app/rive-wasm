import "regenerator-runtime";
import RiveCanvas from "../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs";
import {registerTouchInteractions} from '../../../js/src/utils';
// import RiveCanvas from '../../../js/npm/canvas_advanced_single/canvas_advanced_single.mjs';
import AvatarAnimation from "./look.riv";
import TapeMeshAnimation from "./tape.riv";
import BirdAnimation from "./birb.riv";
import TruckAnimation from "./truck.riv";
import BallAnimation from './ball.riv';
import SwitchAnimation from './switch_event_example.riv';
import "./main.css";

const randomNum = Math.ceil(Math.random() * 100 * 5) + 100;
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
    stateMachine: "",
  },
  5: {
    riveFile: AvatarAnimation,
    animation: "idle",
  },
};

// Loads a default animation and displays it using the advanced api. Drag and
// drop .riv files to see them and play their default animations.
async function renderRiveAnimation({ rive, num, hasRandomSizes }) {
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
        artboard.stateMachineByIndex(0), artboard
      );
    } else {
      animation = new rive.LinearAnimationInstance(artboard.animationByName(riveEx.animation),
                                                   artboard);
    }
  }
  await loadDefault();

  let canvas = document.getElementById(`canvas${num}`);
  if (!canvas) {
    const body = document.querySelector("body");
    canvas = document.createElement("canvas");
    canvas.id = `canvas${num}`;
    body.appendChild(canvas);
  }
  canvas.width = hasRandomSizes ? `${randomNum}` : "400";
  canvas.height = hasRandomSizes ? `${randomNum}` : "400";
  // Don't use the offscreen renderer for FF as it should have a context limit of 300
  const renderer = rive.makeRenderer(canvas, true);

  // Register cursor mouse actions to trigger Rive touch interactions
  const activeStateMachines = stateMachine ? [stateMachine] : [];
  registerTouchInteractions({
    canvas,
    artboard,
    stateMachines: activeStateMachines,
    renderer,
    rive,
    fit: rive.Fit.contain,
    alignment: rive.Alignment.center,
  });

  function loadFile(droppedFile) {
    const reader = new FileReader();
    reader.onload = function (event) {
      stateMachine = null;
      const file = rive.load(new Uint8Array(event.target.result));
      artboard = file.artboardByName("Truck");
      animation = new rive.LinearAnimationInstance(artboard.animationByName("idle"), artboard);
    };

    reader.readAsArrayBuffer(droppedFile);
  }

  document.body.addEventListener("dragover", function (ev) {
    ev.preventDefault();
  });
  document.body.addEventListener("drop", function (ev) {
    ev.preventDefault();

    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === "file") {
          loadFile(ev.dataTransfer.items[i].getAsFile());
          break;
        }
      }
    } else {
      for (var i = 0; i < ev.dataTransfer.files.length; i++) {
        loadFile(ev.dataTransfer.files[i]);
        break;
      }
    }
  });

  let lastTime = 0;
  let artboard, stateMachine, animation;

  function draw(time) {
    if (!lastTime) {
      lastTime = time;
    }
    const elapsedMs = time - lastTime;
    const elapsedSeconds = elapsedMs / 1000;
    lastTime = time;

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

    rive.requestAnimationFrame(draw);
  }
  rive.requestAnimationFrame(draw);
}

async function main() {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const numCanvases = parseInt(params.numCanvases || 0) || 10;
  const hasRandomSizes = !!params.hasRandomSizes || false;
  const rive = await RiveCanvas();
  rive.enableFPSCounter();
  for (let i = 0; i < numCanvases; i++) {
    await renderRiveAnimation({ rive, num: i, hasRandomSizes });
  }
}

main();
