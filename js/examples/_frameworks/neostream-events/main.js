import "./style.css";
import neoStream from "./neostreamv2.riv";
import PopupAudio from "/audio/FlameIntro.wav";
import WindAudio from "/audio/Wind.wav";
import FireballAudio from "/audio/FireBall.wav";
import JumpAudio from "/audio/Jumping1.wav";
import DuckAudio from "/audio/KarateDodge.wav";
import Punch1Audio from "/audio/punch1.wav";
import Punch2Audio from "/audio/punch2.wav";
import Punch3Audio from "/audio/punch3.wav";
import Punch4Audio from "/audio/punch4.wav";
import Fall1Audio from "/audio/BodyFallWoodFloor.wav";
import Fall2Audio from "/audio/BodyFallCement.wav";
import Fall3Audio from "/audio/BodyFallMat.wav";
import * as rive from "@rive-app/canvas";
const { Rive, Fit, Alignment, Layout, EventType } = rive;

async function loadRiveFile() {
  const bytes = await (await fetch(new Request(neoStream))).arrayBuffer();
  return { bytes };
}

const riveCanvas = document.getElementById("rive-canvas");
const textElement = document.getElementById("side-element");

window.startDemo = function () {
  document.getElementById("demo").style.display = "flex";
  document.getElementById("start-button").style.display = "none";
  main();
};

export async function main() {
  const { bytes } = await loadRiveFile();

  const r = new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: riveCanvas,
    stateMachines: "State Machine 1",
    automaticallyHandleEvents: true,
    layout: new Layout({
      fit: Fit.Contain,
    }),
    onLoad: () => {
      r.resizeDrawingSurfaceToCanvas();
    },
  });

  function onRiveEventReceived(riveEvent) {
    let eventName = riveEvent.data.name;
    let properties = riveEvent.data.properties;
    switch (eventName) {
      case "IntroComplete":
        textElement.classList.add("fade");
        break;
      case "ButtonHover":
        if (riveEvent.data.properties["isHovering"]) {
          const audio = new Audio(FireballAudio);
          audio.play();
          document.body.style.cursor = "pointer";
        } else {
          document.body.style.cursor = "auto";
        }
        break;
      case "Sound":
        playSoundByName(properties.soundName);
        break;
      default:
        console.log("Unhandled event: " + eventName);
        console.log(riveEvent);
        break;
    }
  }

  r.on(EventType.RiveEvent, onRiveEventReceived);

  // Resize the drawing surface if the window resizes
  window.addEventListener(
    "resize",
    () => {
      r.resizeDrawingSurfaceToCanvas();
    },
    false,
  );
}

function playSoundByName(soundName) {
  switch (soundName) {
    case "pop":
      playPopupSound();
      break;
    case "wind":
      playWindSound();
      break;
    case "fall":
      playFallSound();
      break;
    case "hit":
      playHitSound();
      break;
    case "jump":
      playJumpSound();
      break;
    case "duck":
      playDuckSound();
      break;
    default:
      console.log("Unhandled sound: " + soundName);
      break;
  }
}

function playPopupSound() {
  const audioIntro = new Audio(PopupAudio);
  audioIntro.play();
}

function playWindSound() {
  const audioWind = new Audio(WindAudio);
  audioWind.play();
}

function playFallSound() {
  const falls = [Fall1Audio, Fall2Audio, Fall3Audio];
  const sound = falls[Math.floor(Math.random() * falls.length)];
  let audio = new Audio(sound);
  audio.play();
}

function playHitSound() {
  const punches = [Punch1Audio, Punch2Audio, Punch3Audio, Punch4Audio];
  const sound = punches[Math.floor(Math.random() * punches.length)];
  const audio = new Audio(sound);
  audio.play();
}

function playDuckSound() {
  const audio = new Audio(DuckAudio);
  audio.play();
}

function playJumpSound() {
  const audio = new Audio(JumpAudio);
  audio.play();
}
