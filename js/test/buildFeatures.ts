// Which wasm build the suite runs against, and what that build compiles in.
// jest.config.js sets __RIVE_BUILD__ from RIVE_BUILD (default: canvas).

export type RiveBuild = "canvas" | "canvas_fallback" | "lite" | "webgl2";
export type BuildFeature = "text" | "layout" | "scripting" | "audio";

export const riveBuild: RiveBuild =
  (globalThis as { __RIVE_BUILD__?: RiveBuild }).__RIVE_BUILD__ ?? "canvas";

// build_wasm.sh -l drops the text, audio, layout and scripting flags.
const missingFeatures: Partial<Record<RiveBuild, BuildFeature[]>> = {
  lite: ["text", "layout", "scripting", "audio"],
};

const hasFeatures = (...features: BuildFeature[]): boolean =>
  !features.some((f) => missingFeatures[riveBuild]?.includes(f));

/** `test`, or `test.skip` on builds that don't compile in the features. */
export const testWith = (...features: BuildFeature[]) =>
  hasFeatures(...features) ? test : test.skip;

/** `describe`, or `describe.skip` on builds that don't compile in the features. */
export const describeWith = (...features: BuildFeature[]) =>
  hasFeatures(...features) ? describe : describe.skip;
