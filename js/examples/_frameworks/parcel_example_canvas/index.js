import "regenerator-runtime";
import { Rive, Fit, Alignment, Layout } from "@rive-app/canvas";
//import { Rive, Fit, Alignment, Layout } from "@rive-app/webgl";
import AvatarAnimation from "./look.riv";
import TapeMeshAnimation from "./tape.riv";
import BirdAnimation from "./birb.riv";
import TruckAnimation from "./truck.riv";
import BallAnimation from "./ball.riv";
import SwitchAnimation from "./switch_event_example.riv";
import NestedDefaultAnimation from "./nested_default.riv";
import JigSaw from "./jigsaw.riv";
import StringRive from "./string.riv";

const RIVE_EXAMPLES = {
  0: {
    riveFile: SwitchAnimation,
    hasStateMachine: true,
    stateMachine: "Main State Machine",
  },
  1: {
    riveFile: BallAnimation,
    hasStateMachine: true,
    stateMachine: "Main State Machine",
  },
  2: {
    riveFile: AvatarAnimation,
    animation: "idle",
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
    riveFile: TapeMeshAnimation,
    animation: "Animation 1",
  },
  6: {
    riveFile: NestedDefaultAnimation,
    hasStateMachine: true,
    stateMachine: "State Machine 1",
  },
  7: {
    riveFile: JigSaw,
    hasStateMachine: true,
    stateMachine: "State Machine 1",
  },
  8: {
    riveFile: StringRive,
    hasStateMachine: true,
    stateMachine: "String",
  },
};

async function loadFile(num) {
  const riveEx = RIVE_EXAMPLES[num % Object.keys(RIVE_EXAMPLES).length];
  const bytes = await (await fetch(new Request(riveEx.riveFile))).arrayBuffer();
  return { bytes, riveEx };
}

async function main(num) {
  const { bytes, riveEx } = await loadFile(num);
  const body = document.querySelector("body");
  const el = document.createElement("canvas");
  el.id = `canvas${num}`;
  el.width = "800";
  el.height = "800";
  body.appendChild(el);

  new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: el,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    ...(riveEx.hasStateMachine && { stateMachines: riveEx.stateMachine }),
  });
}

for (let i = 0; i < 9; i++) {
  main(i);
}
