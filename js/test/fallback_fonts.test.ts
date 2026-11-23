import { RiveFont } from "../src/utils/riveFont";

import { loadFile, loadRive, waitForPredicate } from "./helpers";
import { describeWith } from "./buildFeatures";

// #region RiveFont.setFallbackFontCallback

describeWith("text")("RiveFont.setFallbackFontCallback()", () => {
  afterEach(() => {
    RiveFont.setFallbackFontCallback(null);
  });

  test("user callback is invoked with missingGlyph and weight when a glyph cannot be rendered", async () => {
    const userCallback = jest.fn().mockReturnValue(null);
    RiveFont.setFallbackFontCallback(userCallback);

    const canvas = document.createElement("canvas");
    const r = await loadRive({
      canvas: canvas,
      buffer: loadFile("assets/fallback_fonts_test.riv"),
      autoplay: true,
      autoBind: false,
    });
    const viewModel = r.defaultViewModel();
    const viewModelInstance = viewModel!.defaultInstance();
    r.bindViewModelInstance(viewModelInstance!);
    const outerStringProp = viewModelInstance?.string("text");
    expect(outerStringProp?.value).not.toBeNull();
    outerStringProp!.value = "ส";

    await waitForPredicate(() => userCallback.mock.calls.length > 0);
    // Value specific to the character above. The text names no
    // language, so the request lists only the system languages.
    expect(userCallback).toHaveBeenCalledWith(3626, 400, expect.any(Array));
    r.cleanup();
  });
});

describeWith("text")("RiveFont.setSystemLanguages()", () => {
  afterEach(() => {
    RiveFont.setFallbackFontCallback(null);
    RiveFont.setSystemLanguages(null);
  });

  test("fallback requests list the system languages", async () => {
    const userCallback = jest.fn().mockReturnValue(null);
    RiveFont.setFallbackFontCallback(userCallback);
    RiveFont.setSystemLanguages(["ja_jp", "zh-hans"]);

    const canvas = document.createElement("canvas");
    const r = await loadRive({
      canvas: canvas,
      buffer: loadFile("assets/fallback_fonts_test.riv"),
      autoplay: true,
      autoBind: false,
    });
    const viewModel = r.defaultViewModel();
    const viewModelInstance = viewModel!.defaultInstance();
    r.bindViewModelInstance(viewModelInstance!);
    viewModelInstance!.string("text")!.value = "ส";

    await waitForPredicate(() => userCallback.mock.calls.length > 0);
    // As set, most preferred first.
    expect(userCallback).toHaveBeenCalledWith(3626, 400, ["ja_jp", "zh-hans"]);
    r.cleanup();
  });
});

// #endregion

