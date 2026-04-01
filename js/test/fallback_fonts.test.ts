// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { RiveFont } from "../src/utils/riveFont";
import type { FallbackFontsCallback } from "../src/utils/riveFont";

import { loadFile } from "./helpers";

// #region RiveFont.setFallbackFontCallback

describe("RiveFont.setFallbackFontCallback()", () => {
  afterEach(() => {
    RiveFont.setFallbackFontCallback(null as unknown as FallbackFontsCallback);
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
        // Value specific to the character above
        expect(userCallback).toHaveBeenCalledWith(3626, 400);

        done();
      },
    });
  });

  test("callback is not invoked when text contains only glyphs the embedded font can render", (done) => {
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
        const textProp = viewModelInstance?.string("text");
        // Latin ASCII text is always covered by the embedded font; no fallback lookup needed.
        textProp!.value = "Hello";
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(userCallback).not.toHaveBeenCalled();

        done();
      },
    });
  });
});

// #endregion

