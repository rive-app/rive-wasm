// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { RiveFont } from "../src/utils/riveFont";

import { loadFile } from "./helpers";

// #region RiveFont.setFallbackFontCallback

describe("RiveFont.setFallbackFontCallback()", () => {
  afterEach(() => {
    RiveFont.setFallbackFontCallback(null);
  });

  test("user callback is invoked with missingGlyph and weight when a glyph cannot be rendered", (done) => {
    const userCallback = jest.fn().mockReturnValue(null);
    RiveFont.setFallbackFontCallback(userCallback);

    const canvas = document.createElement("canvas");
    const r = new rive.Rive({
      canvas: canvas,
      buffer: loadFile("assets/fallback_fonts_test.riv"),
      autoplay: true,
      autoBind: false,
      onLoad: async () => {
        const viewModel = r.defaultViewModel();
        const viewModelInstance = viewModel!.defaultInstance();
        r.bindViewModelInstance(viewModelInstance!);
        const outerStringProp = viewModelInstance?.string("text");
        expect(outerStringProp?.value).not.toBeNull();
        outerStringProp!.value = "ส";
        await new Promise((resolve) => setTimeout(resolve, 50));
        // Value specific to the character above. The text names no
        // language, so the request lists only the system languages.
        expect(userCallback).toHaveBeenCalledWith(
          3626,
          400,
          expect.any(Array),
        );

        done();
      },
    });
  });
});

describe("RiveFont.setSystemLanguages()", () => {
  afterEach(() => {
    RiveFont.setFallbackFontCallback(null);
    RiveFont.setSystemLanguages(null);
  });

  test("fallback requests list the system languages", (done) => {
    const userCallback = jest.fn().mockReturnValue(null);
    RiveFont.setFallbackFontCallback(userCallback);
    RiveFont.setSystemLanguages(["ja_jp", "zh-hans"]);

    const canvas = document.createElement("canvas");
    const r = new rive.Rive({
      canvas: canvas,
      buffer: loadFile("assets/fallback_fonts_test.riv"),
      autoplay: true,
      autoBind: false,
      onLoad: async () => {
        const viewModel = r.defaultViewModel();
        const viewModelInstance = viewModel!.defaultInstance();
        r.bindViewModelInstance(viewModelInstance!);
        viewModelInstance!.string("text")!.value = "ส";
        await new Promise((resolve) => setTimeout(resolve, 50));
        // As set, most preferred first.
        expect(userCallback).toHaveBeenCalledWith(3626, 400, [
          "ja_jp",
          "zh-hans",
        ]);
        done();
      },
    });
  });
});

// #endregion

