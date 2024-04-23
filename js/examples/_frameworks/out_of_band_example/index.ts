import "regenerator-runtime";
import {
  Rive,
  Fit,
  Alignment,
  Layout,
  EventType,
  FileAsset,
  ImageAsset,
  AudioAsset,
  FontAsset,
  decodeAudio,
  decodeImage,
  decodeFont,
} from "@rive-app/canvas";
// import {
//   Rive,
//   Fit,
//   Alignment,
//   Layout,
//   EventType,
//   FileAsset,
//   ImageAsset,
//   AudioAsset,
//   FontAsset,
//   decodeAudio,
//   decodeImage,
//   decodeFont,
// } from "@rive-app/webgl";
import RiveTextAndImageFile from "./asset_load_check.riv";
import RiveAudioFile from "/assets/ping_pong_audio_demo.riv";
import AudioRacket1 from "./assets/racket1-59343.wav";
import AudioRacket2 from "./assets/racket2-59344.wav";
import AudioTable from "./assets/table-59328.wav";

let fontIndex = 0;

async function loadTextAndImageRiveFile() {
  return await (await fetch(new Request(RiveTextAndImageFile))).arrayBuffer();
}

async function loadAudioRiveFile() {
  return await (await fetch(new Request(RiveAudioFile))).arrayBuffer();
}

const randomImageAsset = (asset: ImageAsset) => {
  fetch("https://picsum.photos/1000/1500").then(async (res) => {
    // asset.decode(new Uint8Array(await res.arrayBuffer()));
    const image = await decodeImage(new Uint8Array(await res.arrayBuffer()));
    asset.setRenderImage(image);
    image.unref();
  });
};
const randomFontAsset = (asset: FontAsset) => {
  const urls = [
    "https://cdn.rive.app/runtime/flutter/IndieFlower-Regular.ttf",
    "https://cdn.rive.app/runtime/flutter/comic-neue.ttf",
    "https://cdn.rive.app/runtime/flutter/inter.ttf",
    "https://cdn.rive.app/runtime/flutter/inter-tight.ttf",
    "https://cdn.rive.app/runtime/flutter/josefin-sans.ttf",
    "https://cdn.rive.app/runtime/flutter/send-flowers.ttf",
  ];
  fetch(urls[fontIndex++ % urls.length]).then(async (res) => {
    // asset.decode(new Uint8Array(await res.arrayBuffer()));

    const font = await decodeFont(new Uint8Array(await res.arrayBuffer()));
    asset.setFont(font);
    font.unref();
  });
};

const loadAudioAssetByUniqueName = (asset: AudioAsset) => {
  switch (asset.uniqueFilename) {
    case "racket1-59343.wav":
      _loadAudioAsset(asset, AudioRacket1);
      break;
    case "racket2-59344.wav":
      _loadAudioAsset(asset, AudioRacket2);
      break;
    case "table-59328.wav":
      _loadAudioAsset(asset, AudioTable);
      break;
    default:
      break;
  }
};

async function _loadAudioAsset(asset: AudioAsset, file: string) {
  fetch(new Request(file)).then(async (res) => {
    const audio = await decodeAudio(new Uint8Array(await res.arrayBuffer()));
    asset.setAudioSource(audio);
    audio.unref();
  });
}

async function main() {
  createRiveOutOfBandAudio();
  createRiveOutOfBandTextAndImages();
}

async function createRiveOutOfBandTextAndImages() {
  const bytes = await loadTextAndImageRiveFile();
  const riveCanvas = document.getElementById(
    "canvas-text-and-images",
  ) as HTMLCanvasElement;

  let imageAsset, fontAsset;

  const rive = new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: riveCanvas,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    assetLoader: (asset: FileAsset, bytes: Uint8Array) => {
      console.log(
        "Tell our asset importer if we are going to load the asset contents",
        {
          name: asset.name,
          fileExtension: asset.fileExtension,
          cdnUuid: asset.cdnUuid,
          isFont: asset.isFont,
          isImage: asset.isImage,
          isAudio: asset.isAudio,
          bytes,
        },
      );

      if (asset.cdnUuid.length > 0 || bytes.length > 0) {
        return false;
      }

      if (asset.isAudio) {
        loadAudioAssetByUniqueName(asset as AudioAsset);
        return true;
      }
      if (asset.isImage) {
        imageAsset = asset;
        randomImageAsset(imageAsset as ImageAsset);
        return true;
      } else if (asset.isFont) {
        fontAsset = asset;
        randomFontAsset(fontAsset as FontAsset);
        return true;
      }
      return false;
    },
  });
  function onRiveEventReceived(riveEvent) {
    console.log("Rive Event Fired", riveEvent);
  }
  rive.on(EventType.RiveEvent, onRiveEventReceived);
}

async function createRiveOutOfBandAudio() {
  const bytes = await loadAudioRiveFile();
  const riveCanvas = document.getElementById(
    "canvas-audio",
  ) as HTMLCanvasElement;

  const rive = new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: riveCanvas,
    stateMachines: "State Machine 1",
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    assetLoader: (asset: FileAsset, bytes: Uint8Array) => {
      // Embedded asset, skip
      if (asset.cdnUuid.length > 0 || bytes.length > 0) {
        return false;
      }

      if (asset.isAudio) {
        loadAudioAssetByUniqueName(asset as AudioAsset);
        return true;
      }

      return false;
    },
  });
}

main();
