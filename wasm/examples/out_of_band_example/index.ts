import RiveCanvas from "../../../js/npm/canvas_advanced_single/canvas_advanced_single.mjs";
// import RiveCanvas from "../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs";

import SampleImage from "./asset_load_check.riv";

let lastTime;

async function main() {
  let rive = await RiveCanvas();
  // Instance the Rive runtime (this does WASM stuff).
  // Get some rive file bytes (we uploaded piggy.riv into this
  // sandbox, you can see it in the file list on the left.)
  let fileBytes = new Uint8Array(
    await (await fetch(new Request(SampleImage))).arrayBuffer()
  );
  let imageAsset;
  let fontAsset;
  let artboard;
  let fontIndex = 0;

  const randomImageAsset = (asset) => {
    fetch("https://picsum.photos/1000/1500").then(async (res) => {
      rive.decodeImage(new Uint8Array(await res.arrayBuffer()), (image) => {
        // Maybe the api would be nicer as renderImage = image?
        asset.setRenderImage(image);
        rive.requestAnimationFrame(draw);
      });
    });
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

    fetch(urls[fontIndex++ % urls.length]).then(async (res) => {
      
      rive.decodeFont(new Uint8Array(await res.arrayBuffer()), (font) => {
        // Note, currently updating fonts will not mark 
        // shapes that depend on fonts as dirty, so they will not be re-rendered
        // unless they are animated. 
        asset.setFont(font);
        rive.requestAnimationFrame(draw);        
      });

    });
  };

  const file = await rive.load(
    fileBytes,
    new rive.CustomFileAssetLoader({
      loadContents: (asset, inBandBytes) => {
        console.log("Tell our asset importer if we are going to load the asset contents", {
          name: asset.name,
          fileExtension: asset.fileExtension,
          cdnUuid: asset.cdnUuid,
          isImage: asset.isImage,
          isFont: asset.isFont,
          inBandBytes,
        });

        if (asset.cdnUuid.length >0 || inBandBytes.length > 0) {
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
    })
  );

  artboard = file.defaultArtboard();
  const animation = new rive.LinearAnimationInstance(
    artboard.animationByIndex(0),
    artboard
  );
  const canvas = document.getElementById("canvas0") as HTMLCanvasElement;
  canvas.onclick = () => {
    randomImageAsset(imageAsset);
    randomFontAsset(fontAsset);
  };

  // Helper to update the size of the canvas to fit the window.
  function computeSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.onresize = computeSize;
  computeSize();

  const renderer = rive.makeRenderer(canvas, true);

  function draw(time) {
    if (!renderer) {
      return;
    }
    if (!lastTime) {
      lastTime = time;
    }
    const elapsedMs = time - lastTime;
    const elapsedSeconds = elapsedMs / 1000;
    lastTime = time;

    renderer.clear();
    if (artboard) {
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

    // Draw more if we want to.
    rive.requestAnimationFrame(draw);
  }
  rive.requestAnimationFrame(draw);
}

main();
