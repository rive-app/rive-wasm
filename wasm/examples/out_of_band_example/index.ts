import RiveCanvas from "../../../js/npm/canvas_advanced_single/canvas_advanced_single.mjs";
// import RiveCanvas from "../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs";

const SampleImage = new URL("./asset_load_check.riv", import.meta.url);

let lastTime;

async function main() {
  let rive = await RiveCanvas();
  const canvas = document.getElementById("canvas0") as HTMLCanvasElement;
  const renderer = rive.makeRenderer(canvas, true);

  // Instance the Rive runtime (this does WASM stuff).
  // Get some rive file bytes (we uploaded piggy.riv into this
  // sandbox, you can see it in the file list on the left.)
  let fileBytes = new Uint8Array(
    await (await fetch(new Request(SampleImage))).arrayBuffer()
  );
  let onDemandFont;
  let onDemandImage;
  let cachedFont;
  let cachedImage;
  let artboard;
  let fontIndex = 0;
  let imageCache = <any>[];
  let imageCacheIndex = 0;
  let fontCache = <any>[];
  let fontCacheIndex = 0;
  console.log("Warming up image cache...");
  await new Promise<void>((resolve, reject) => {
    let imageCacheSize = 5;
    for (let i = 0; i < imageCacheSize; i++) {
      fetch("https://picsum.photos/2048/1365").then(async (res) => {
        rive.decodeImage(new Uint8Array(await res.arrayBuffer()), (image) => {
          imageCache.push(image);
          if (imageCache.length == imageCacheSize) {
            resolve();
          }
        });
      });
    }
  });
  console.log("Warming up font cache...");
  await new Promise<void>((resolve, reject) => {
    const urls = [
      "https://cdn.rive.app/runtime/flutter/IndieFlower-Regular.ttf",
      "https://cdn.rive.app/runtime/flutter/comic-neue.ttf",
      "https://cdn.rive.app/runtime/flutter/inter.ttf",
      "https://cdn.rive.app/runtime/flutter/inter-tight.ttf",
      "https://cdn.rive.app/runtime/flutter/josefin-sans.ttf",
      "https://cdn.rive.app/runtime/flutter/send-flowers.ttf",
    ];
    for (let i = 0; i < urls.length; i++) {
      fetch(urls[i]).then(async (res) => {
        rive.decodeFont(new Uint8Array(await res.arrayBuffer()), (font) => {
          fontCache.push(font);
          if (fontCache.length === urls.length) {
            resolve();
          }
        });
      });
    }
  });

  const cachedImageAsset = (asset) => {
    let image = imageCache[imageCacheIndex++ % imageCache.length];
    asset.setRenderImage(image);
    requestAnimationFrame(draw);
    // IMPORTANT: to clear the cache, be sure to also call .unref() on each asset.
  };

  const cachedFontAsset = (asset) => {
    let font = fontCache[fontCacheIndex++ % fontCache.length];
    asset.setFont(font);
    requestAnimationFrame(draw);
    // IMPORTANT: to clear the cache, be sure to also call .unref() on each asset.
  };

  const randomImageAsset = (asset) => {
    fetch("https://picsum.photos/1000/1500").then(async (res) => {
      rive.decodeImage(new Uint8Array(await res.arrayBuffer()), (image) => {
        asset.setRenderImage(image);
        requestAnimationFrame(draw);
        // IMPORTANT: call unref, so that we do not keep the asset alive with
        // a reference from javascript.
        image.unref();
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
        asset.setFont(font);

        requestAnimationFrame(draw);
        // IMPORTANT: call unref, so that we do not keep the asset alive with
        // a reference from javascript.
        font.unref();
      });
    });
  };

  const file = await rive.load(
    fileBytes,
    new rive.CustomFileAssetLoader({
      loadContents: (asset, inBandBytes) => {
        if (inBandBytes.length > 0) {
          return false;
        }
        if (asset.cdnUuid.length > 0) {
          return false;
        }
        switch (asset.name) {
          case "flower.jpeg":
            onDemandImage = asset;
            randomImageAsset(asset);
            return true;
          case "tree.jpg":
            cachedImage = asset;
            cachedImageAsset(asset);
            return true;
          case "Kenia":
            cachedFont = asset;
            cachedFontAsset(asset);
            return true;
          case "Kodchasan":
            onDemandFont = asset;
            randomFontAsset(asset);
            return true;
          case "three.png":
            cachedImage = asset;
            cachedImageAsset(asset);
            return true;
          case "Inter":
            onDemandFont = asset;
            randomFontAsset(asset);
            return true;
        }
        console.log("Eeek not dealing with ", {
          length: inBandBytes.length,
          name: asset.name,
          fileExtension: asset.fileExtension,
          cdnUuid: asset.cdnUuid,
          isImage: asset.isImage,
          isFont: asset.isFont,
          inBandBytes,
        });
        return false;
      },
    })
  );

  artboard = file.defaultArtboard();
  const animation = new rive.LinearAnimationInstance(
    artboard.animationByIndex(0),
    artboard
  );
  canvas.onclick = () => {
    if (onDemandImage) randomImageAsset(onDemandImage);
    if (onDemandFont) randomFontAsset(onDemandFont);
    if (cachedImage) cachedImageAsset(cachedImage);
    if (cachedFont) cachedFontAsset(cachedFont);
  };

  // Helper to update the size of the canvas to fit the window.
  function computeSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.onresize = computeSize;
  computeSize();

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
    requestAnimationFrame(draw);
    rive.resolveAnimationFrame();
  }
  requestAnimationFrame(draw);
}

main();
