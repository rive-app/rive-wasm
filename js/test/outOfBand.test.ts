import * as rive from "../src/rive";
import { loadFile, waitForPredicate } from "./helpers";
import { CustomFileAssetLoaderWrapper } from "../src/utils/finalizationRegistry";

function makeRuntime() {
  return {
    CustomFileAssetLoader: function (this: any, { loadContents }: any) {
      this.loadContents = loadContents;
    },
  } as any;
}

function makeAsset(overrides: {
  isImage?: boolean;
  isAudio?: boolean;
  isFont?: boolean;
}) {
  return { isImage: false, isAudio: false, isFont: false, ...overrides } as any;
}

describe("CustomFileAssetLoaderWrapper.loadContents", () => {
  it("returns false and does not call callback for unknown asset type", () => {
    const callback = jest.fn();
    const wrapper = new CustomFileAssetLoaderWrapper(makeRuntime(), callback);

    const result = wrapper.loadContents(makeAsset({}), new Uint8Array());

    expect(result).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it("calls callback with ImageAssetWrapper for image assets", () => {
    const callback = jest.fn().mockReturnValue(true);
    const wrapper = new CustomFileAssetLoaderWrapper(makeRuntime(), callback);
    const bytes = new Uint8Array([1, 2, 3]);

    const result = wrapper.loadContents(makeAsset({ isImage: true }), bytes);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][1]).toBe(bytes);
    expect(result).toBe(true);
  });

  it("calls callback with AudioAssetWrapper for audio assets", () => {
    const callback = jest.fn().mockReturnValue(true);
    const wrapper = new CustomFileAssetLoaderWrapper(makeRuntime(), callback);
    const bytes = new Uint8Array([4, 5, 6]);

    const result = wrapper.loadContents(makeAsset({ isAudio: true }), bytes);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][1]).toBe(bytes);
    expect(result).toBe(true);
  });

  it("calls callback with FontAssetWrapper for font assets", () => {
    const callback = jest.fn().mockReturnValue(true);
    const wrapper = new CustomFileAssetLoaderWrapper(makeRuntime(), callback);
    const bytes = new Uint8Array([7, 8, 9]);

    const result = wrapper.loadContents(makeAsset({ isFont: true }), bytes);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][1]).toBe(bytes);
    expect(result).toBe(true);
  });
});

// Records what the asset loader was called with, so assertions run in the
// test body (an expect thrown inside the loader would be swallowed by Rive).
function recordAssets(file: string, count = 1) {
  const seen: any[] = [];
  const r = new rive.Rive({
    canvas: document.createElement("canvas"),
    buffer: loadFile(file),
    autoplay: true,
    // Only what the loader receives matters here; don't fetch from the CDN.
    enableRiveAssetCDN: false,
    assetLoader: (asset, bytes) => {
      seen.push({
        bytesLength: bytes.length,
        name: asset.name,
        cdnUuid: asset.cdnUuid,
        fileExtension: asset.fileExtension,
        uniqueFilename: asset.uniqueFilename,
        isImage: asset.isImage,
        isFont: asset.isFont,
        isAudio: asset.isAudio,
      });
      return false;
    },
  });
  return waitForPredicate(() => seen.length >= count).then(() => ({ r, seen }));
}

test("Ensure onAsset called with hosted asset, contains cdn information.", async () => {
  const { r, seen } = await recordAssets("assets/hosted_png_asset.riv");
  const asset = seen[0];
  expect(asset.bytesLength).toBe(0);
  expect(asset.name).toBe("some.png");
  expect(asset.cdnUuid).toBe("0b97b223-4bce-4502-8b07-51867a49d78d");
  expect(asset.fileExtension).toBe("png");
  expect(asset.isImage).toBe(true);
  expect(asset.isFont).toBe(false);
  r.cleanup();
});

test("Ensure onAsset called with embedded asset, contains bytes.", async () => {
  const mock = jest.fn();
  window.URL.createObjectURL = mock;
  const canvas = document.createElement("canvas");
  await new Promise<void>((resolve) => {
    new rive.Rive({
      canvas: canvas,
      buffer: loadFile("assets/embedded_png_asset.riv"),
      autoplay: true,
      assetLoader: (asset, bytes) => {
        expect(bytes.length).toBe(308);
        expect(asset.name).toBe("1x1.png");
        expect(asset.cdnUuid).toBe("");
        expect(asset.fileExtension).toBe("png");
        expect(asset.isImage).toBe(true);
        expect(asset.isFont).toBe(false);

        resolve();
        return false;
      },
    });
  });

  // embedded assets do a fake request grabbing a blob
  // also, this might be suffer from race conditions, but the load
  // should be initialized once a file is read
  expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
  expect(mock.mock.calls[0][0].size).toBe(308);
});

test("Ensure onAsset called with referenced image asset, contains no cdn/byte information.", async () => {
  const { r, seen } = await recordAssets("assets/referenced_png_asset.riv");
  const asset = seen[0];
  expect(asset.bytesLength).toBe(0);
  expect(asset.name).toBe("1x1.png");
  expect(asset.cdnUuid).toBe("");
  expect(asset.fileExtension).toBe("png");
  expect(asset.isImage).toBe(true);
  expect(asset.isFont).toBe(false);
  r.cleanup();
});

test("Ensure onAsset called with referenced font asset, contains no cdn/byte information.", async () => {
  const { r, seen } = await recordAssets("assets/referenced_font_asset.riv");
  const asset = seen[0];
  expect(asset.bytesLength).toBe(0);
  expect(asset.name).toBe("Inter");
  expect(asset.cdnUuid).toBe("");
  expect(asset.fileExtension).toBe("ttf");
  expect(asset.isImage).toBe(false);
  expect(asset.isFont).toBe(true);
  r.cleanup();
});

test("Test audio asset has correct data", async () => {
  const { r, seen } = await recordAssets("assets/audio_test.riv", 2);
  for (const asset of seen) {
    expect(asset.isAudio).toBe(true);
    if (asset.isAudio && asset.cdnUuid.length > 0) {
      expect(asset.name).toBe("hosted");
      expect(asset.uniqueFilename).toBe("hosted-55368.wav");
      expect(asset.fileExtension).toBe("wav");
      expect(asset.cdnUuid).toBe("79b65f1e-94ea-4191-b5ad-b3d5495b6343");
    } else if (asset.isAudio && asset.bytesLength > 0) {
      expect(asset.name).toBe("embedded");
      expect(asset.uniqueFilename).toBe("embedded-0.wav");
      expect(asset.fileExtension).toBe("wav");
    }
  }
  r.cleanup();
});
