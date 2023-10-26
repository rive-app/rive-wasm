import "regenerator-runtime";
import {
  Rive,
  Fit,
  Alignment,
  Layout,
  EventType,
  decodeImage,
  decodeFont,
} from "@rive-app/canvas";
// import { 
//   Rive,
//   Fit,
//   Alignment,
//   Layout,
//   EventType,
//   decodeImage,
//   decodeFont, } from "@rive-app/webgl";
import SampleFile from "./asset_load_check.riv";


let fontIndex = 0;

async function loadFile() {
  return await (await fetch(new Request(SampleFile))).arrayBuffer();
}


const randomImageAsset = (asset) => {
  fetch("https://picsum.photos/1000/1500").then(
    async (res) => {
      const image = await decodeImage(new Uint8Array(await res.arrayBuffer()));
      asset.setRenderImage(image);
      image.unref();
    }
  );
};
const randomFontAsset = (asset) => {

  const urls = [
    "https://cdn.rive.app/runtime/flutter/IndieFlower-Regular.ttf",
    "https://cdn.rive.app/runtime/flutter/comic-neue.ttf",
    "https://cdn.rive.app/runtime/flutter/inter.ttf",
    "https://cdn.rive.app/runtime/flutter/inter-tight.ttf",
    "https://cdn.rive.app/runtime/flutter/josefin-sans.ttf",
    "https://cdn.rive.app/runtime/flutter/send-flowers.ttf",
  ];
  fetch(urls[fontIndex++ % urls.length]).then(
    async (res) => {
      const font = await decodeFont(new Uint8Array(await res.arrayBuffer()));
      asset.setFont(font);
      font.unref();
    }
  );
};

async function main() {
  const bytes = await loadFile();
  const body = document.querySelector("body");
  const el = document.createElement("canvas");
  
  el.onclick = () => {
    randomImageAsset(imageAsset);
    randomFontAsset(fontAsset);
  };
  el.id = `canvas`;
  el.width = "1600";
  el.height = "800";
  body.appendChild(el);

  let imageAsset, fontAsset;

  const r = new Rive({
    buffer: bytes,
    autoplay: true,
    canvas: el,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    loadCDNAssets: true, 
    assetLoader: (asset, bytes) => {
      console.log("Tell our asset importer if we are going to load the asset contents", {
        name: asset.name,
        fileExtension: asset.fileExtension,
        cdnUuid: asset.cdnUuid,
        isFont: asset.isFont,
        isImage: asset.isImage,
        bytes,
      });

      if (asset.cdnUuid.length > 0 || bytes.length > 0) {
        return false;
      }

      if (asset.isImage) {
          imageAsset = asset;
          randomImageAsset(asset);
          return true;
      } else if (asset.isFont) {
          fontAsset = asset;
          randomFontAsset(asset);
          return true;
        }
        return false;
    },
  });
  function onRiveEventReceived(riveEvent) {
    console.log("Rive Event Fired", riveEvent);
  }
  r.on(EventType.RiveEvent, onRiveEventReceived);
}

main();
