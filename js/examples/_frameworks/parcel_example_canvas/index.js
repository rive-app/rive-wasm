import "regenerator-runtime";
import { Rive, Fit, Alignment, Layout, EventType } from "@rive-app/canvas";
// import { Rive, Fit, Alignment, Layout, EventType } from "@rive-app/canvas-lite";
//import { Rive, Fit, Alignment, Layout } from "@rive-app/webgl";

const AvatarAnimation = new URL("./look.riv", import.meta.url);
const TapeMeshAnimation = new URL("./tape.riv", import.meta.url);
const BirdAnimation = new URL("./birb.riv", import.meta.url);
const TruckAnimation = new URL("./truck.riv", import.meta.url);
const SwitchAnimation = new URL("./switch_event_example.riv", import.meta.url);
const NestedDefaultAnimation = new URL("./nested_default.riv", import.meta.url);
const JigSaw = new URL("./jigsaw.riv", import.meta.url);
const StringRive = new URL("./string.riv", import.meta.url);
const RatingAnimation = new URL("./rating_animation.riv", import.meta.url);
const TextAnimation = new URL("./text_test_2.riv", import.meta.url);

const RIVE_EXAMPLES = {
  0: {
    riveFile: RatingAnimation,
    hasStateMachine: true,
    stateMachine: "State Machine 1",
  },
  1: {
    riveFile: SwitchAnimation,
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
  9: {
    riveFile: TextAnimation,
    hasStateMachine: true,
    stateMachine: "State Machine 1",
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
  el.width = "400";
  el.height = "400";
  body.appendChild(el);

  const r = new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: el,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    autoBind: true,
    ...(riveEx.hasStateMachine && { stateMachines: riveEx.stateMachine }),
  });
  function onRiveEventReceived(riveEvent) {
    console.log("Rive Event Fired", riveEvent);
  }
  r.on(EventType.RiveEvent, onRiveEventReceived);
}

for (let i = 0; i < 10; i++) {
  main(i);
}
