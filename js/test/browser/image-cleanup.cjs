const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const webpack = require("webpack");

const root = path.resolve(__dirname, "../..");
const advanced = path.dirname(require.resolve("@rive-app/webgl2-advanced"));
const output = path.join(root, "build/image-cleanup");
const repeats = Number(process.env.RIVE_TEST_REPEATS || 3);
const expectDeleteTexture = process.argv.includes("--expect-delete-texture");

async function build() {
  const [config] = require("../../webpack.config.js")({ targets: "webgl2" });
  config.context = root;
  config.resolve.alias["./rive_advanced.mjs"] = require.resolve(
    "@rive-app/webgl2-advanced",
  );
  config.output.path = output;
  config.plugins = config.plugins.filter(
    (plugin) => plugin.constructor.name !== "FileManagerPlugin",
  );
  await new Promise((resolve, reject) => {
    const compiler = webpack(config);
    compiler.run((error, stats) => {
      compiler.close((closeError) => {
        if (error || closeError) return reject(error || closeError);
        if (stats.hasErrors())
          return reject(new Error(stats.toString("errors-only")));
        resolve();
      });
    });
  });
}

async function collectImage(page, session) {
  for (let attempt = 0; attempt < 10; attempt++) {
    await session.send("HeapProfiler.collectGarbage");
    await page.evaluate(() => new Promise(requestAnimationFrame));
    if (await page.evaluate(() => window.imageCollected)) return;
  }
  assert.fail("The image wrapper was not collected; the test is inconclusive");
}

async function renderScreenshot(page, directory, name) {
  await page.evaluate(async () => {
    const canvas = document.getElementById("rive");
    canvas.width = canvas.width;
    animation.startRendering();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    animation.stopRendering();
  });
  return page.locator("#rive").screenshot({
    path: path.join(directory, `${name}.png`),
  });
}

async function run(browser, scenario, iteration) {
  const directory = path.join(
    output,
    "screenshots",
    scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    String(iteration),
  );
  await fs.mkdir(directory, { recursive: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.setDefaultTimeout(10000);
  try {
    await page.addInitScript(({ withoutRegistry }) => {
      window.imageCollected = false;
      window.collectionWitness = new FinalizationRegistry(() => {
        window.imageCollected = true;
      });
      if (withoutRegistry) window.FinalizationRegistry = undefined;
    }, scenario);
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      const files = {
        "/rive.js": ["text/javascript", path.join(output, "rive.js")],
        "/rive.wasm": ["application/wasm", path.join(advanced, "rive.wasm")],
        "/image.riv": [
          "application/octet-stream",
          path.join(root, "test/assets/embedded_png_asset.riv"),
        ],
      };
      if (url.origin !== "https://rive.test") return route.abort();
      if (url.pathname === "/") {
        return route.fulfill({
          contentType: "text/html",
          body: '<canvas id="rive" width="320" height="320"></canvas>',
        });
      }
      const file = files[url.pathname];
      return file
        ? route.fulfill({ contentType: file[0], path: file[1] })
        : route.abort();
    });
    await page.goto("https://rive.test/");
    await page.addScriptTag({ url: "https://rive.test/rive.js" });
    await page.evaluate(async ({ releaseBeforeRender }) => {
      rive.RuntimeLoader.setWasmUrl("https://rive.test/rive.wasm");
      rive.RuntimeLoader.setWasmFallbackUrl(null);
      window.runtime = await rive.RuntimeLoader.awaitInstance();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const context = canvas.getContext("2d");
      context.fillStyle = "red";
      context.fillRect(0, 0, 256, 256);
      const bytes = Uint8Array.from(
        atob(canvas.toDataURL().split(",")[1]),
        (c) => c.charCodeAt(0),
      );
      let imageLoaded;
      await new Promise((resolve, reject) => {
        window.animation = new rive.Rive({
          canvas: document.getElementById("rive"),
          src: "https://rive.test/image.riv",
          useOffscreenRenderer: false,
          enableRiveAssetCDN: false,
          drawingOptions: rive.DrawOptimizationOptions.AlwaysDraw,
          assetLoader: (asset) => {
            if (!asset.isImage) return false;
            imageLoaded = rive.decodeImage(bytes).then((image) => {
              window.retainedImage = image;
              window.collectionWitness.register(image, "image");
              asset.setRenderImage(image);
              if (releaseBeforeRender) image.unref();
            });
            return true;
          },
          onLoad: resolve,
          onLoadError: (event) => reject(new Error(String(event.data))),
        });
      });
      await imageLoaded;
    }, scenario);
    await page.waitForFunction(
      () =>
        runtime.images.size === 1 &&
        [...runtime.images.values()].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
    );
    const screenshot = await renderScreenshot(
      page,
      directory,
      scenario.releaseBeforeRender
        ? "first-render-after-unref"
        : "before-unref",
    );
    const redPixels = await page.evaluate(
      async (bytes) => {
        const bitmap = await createImageBitmap(
          new Blob([new Uint8Array(bytes)], { type: "image/png" }),
        );
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        context.drawImage(bitmap, 0, 0);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] === 255 && pixels[i + 1] === 0 && pixels[i + 2] === 0)
            count++;
        }
        bitmap.close();
        return count;
      },
      [...screenshot],
    );
    assert.ok(
      redPixels > 100,
      "The assigned image must be visible in the initial render",
    );
    await page.evaluate((releases) => {
      for (let i = 0; i < releases; i++) window.retainedImage.unref();
    }, scenario.releases);
    const afterUnref = await renderScreenshot(page, directory, "after-unref");
    assert.deepEqual(
      afterUnref,
      screenshot,
      `${scenario.name}: a fresh render after unref must match the initial image`,
    );
    const session = await page.context().newCDPSession(page);
    if (scenario.collectBeforeCleanup) {
      await page.evaluate(() => {
        window.retainedImage = undefined;
      });
      await collectImage(page, session);
      const afterGC = await renderScreenshot(page, directory, "after-gc");
      assert.deepEqual(
        afterGC,
        screenshot,
        "A fresh render after GC must retain the image owned by the asset",
      );
    }
    await page.evaluate(async () => {
      const instance = animation;
      window.animation = undefined;
      document.getElementById("rive").remove();
      await new Promise((resolve, reject) =>
        queueMicrotask(() => {
          try {
            instance.cleanup();
            resolve();
          } catch (error) {
            reject(error);
          }
        }),
      );
      window.retainedImage = undefined;
    });
    if (!scenario.collectBeforeCleanup) await collectImage(page, session);
    await session.send("HeapProfiler.collectGarbage");
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.deepEqual(
      errors,
      expectDeleteTexture
        ? ["Cannot read properties of undefined (reading 'deleteTexture')"]
        : [],
      `${scenario.name}: browser errors after cleanup and image collection`,
    );
    assert.equal(
      await page.evaluate(() => runtime.images.size),
      0,
      "The native image must be released",
    );
    return screenshot;
  } finally {
    await page.close();
  }
}

(async () => {
  assert.ok(Number.isInteger(repeats) && repeats > 0);
  const started = performance.now();
  await build();
  const browser = await chromium.launch({
    args: ["--enable-unsafe-swiftshader"],
  });
  try {
    const scenarios = expectDeleteTexture
      ? [{ name: "deleteTexture after cleanup", releases: 1 }]
      : [
          {
            name: "GC before cleanup without explicit unref",
            releases: 0,
            collectBeforeCleanup: true,
          },
          { name: "explicit unref, then cleanup, then GC", releases: 1 },
          {
            name: "unref before the first render, then cleanup, then GC",
            releases: 0,
            releaseBeforeRender: true,
          },
          { name: "repeated unref, then cleanup, then GC", releases: 2 },
          {
            name: "no FinalizationRegistry",
            releases: 2,
            withoutRegistry: true,
          },
        ];
    let expectedPixels;
    for (const scenario of scenarios) {
      for (let i = 0; i < repeats; i++) {
        let deadline;
        const timeout = new Promise((_, reject) => {
          deadline = setTimeout(
            () => reject(new Error(`${scenario.name} exceeded 15s`)),
            15000,
          );
        });
        const pixels = await Promise.race([
          run(browser, scenario, i + 1),
          timeout,
        ]).finally(() => clearTimeout(deadline));
        expectedPixels ??= pixels;
        assert.deepEqual(
          pixels,
          expectedPixels,
          "All scenarios must render the same image",
        );
      }
      console.log(`PASS ${scenario.name} (${repeats}/${repeats})`);
    }
    console.log(
      `${expectDeleteTexture ? "Bug reproduction" : "Image cleanup regression"} passed in ${((performance.now() - started) / 1000).toFixed(1)}s`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
