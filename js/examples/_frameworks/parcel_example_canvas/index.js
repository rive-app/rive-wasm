import "regenerator-runtime";
import { Rive, Fit } from "@rive-app/canvas";
import AvatarAnimation from "./look.riv";
import TapeMeshAnimation from "./tape.riv";
import BirdAnimation from "./birb.riv";
import TruckAnimation from "./truck.riv";

const RIVE_EXAMPLES = {
  0: {
    riveFile: TruckAnimation,
    hasStateMachine: true,
    stateMachine: "drive",
  },
  1: {
    riveFile: TapeMeshAnimation,
    animation: "Animation 1",
  },
  2: {
    riveFile: AvatarAnimation,
    animation: "idle",
  },
  3: {
    riveFile: BirdAnimation,
    animation: "idle",
  },
};

async function loadFile(num) {
  const riveEx = RIVE_EXAMPLES[num % Object.keys(RIVE_EXAMPLES).length];
  const bytes = await (await fetch(new Request(riveEx.riveFile))).arrayBuffer();
  return {bytes, riveEx};
}

async function main(num) {
  const {bytes, riveEx} = await loadFile(num);
  const body = document.querySelector("body"); 
  const el = document.createElement('canvas');
  el.id = `canvas${num}`;
  el.width = "400";
  el.height = "400";
  body.appendChild(el);

  new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: el,
    fit: Fit.cover,
    ...(riveEx.hasStateMachine && {stateMachines: riveEx.stateMachine}),
  });
}

for (let i = 0; i < 10; i++) {
  main(i);
}
