// Draws files that exercise different renderer paths for several frames. The
// canvas renderer calls back into JS for every path, paint, clip and image
// op, so a glue function renamed or missing in one build throws here. It runs
// on the SIMD canvas build and, through `npm run test:matrix`, on lite.
//
// An error thrown inside the render loop reaches the test through
// console.error: jsdom reports errors from requestAnimationFrame callbacks
// there.
import * as rive from "../src/rive";
import { BuildFeature, testWith } from "./buildFeatures";
import {
  loadRive,
  runtimeFixture,
  waitForPredicate,
} from "./helpers";

const unitTestAsset = (name: string) =>
  runtimeFixture(`tests/unit_tests/assets/${name}`);

// Files with images need a real browser: jsdom can't decode them. So do
// feathered paths: the canvas renderer draws them through WebGL2.
const files: [string, () => ArrayBuffer, BuildFeature[]][] = [
  ["clipping", () => unitTestAsset("clip_tests.riv"), []],
  ["animated clipping", () => unitTestAsset("animated_clipping.riv"), []],
  ["trim paths", () => unitTestAsset("trim_path.riv"), []],
  ["nested artboards", () => unitTestAsset("nested_mesh_pointers.riv"), []],
  ["text strokes", () => unitTestAsset("text_stroke_test.riv"), ["text"]],
];

let consoleError: jest.SpyInstance;

beforeEach(() => {
  consoleError = jest.spyOn(console, "error");
});

afterEach(() => {
  consoleError.mockRestore();
});

describe.each(files)("%s", (_, buffer, features) => {
  testWith(...features)("draws 10 frames without errors", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const advances = jest.fn();
    const r = await loadRive({
      canvas,
      buffer: buffer(),
      autoplay: true,
      drawingOptions: rive.DrawOptimizationOptions.AlwaysDraw,
      onAdvance: advances,
    });

    await waitForPredicate(() => advances.mock.calls.length >= 10);

    expect(consoleError).not.toHaveBeenCalled();
    r.cleanup();
  });
});
