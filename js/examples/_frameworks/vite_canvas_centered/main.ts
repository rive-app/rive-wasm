import {
  Rive,
  Fit,
  Alignment,
  Layout,
  decodeFont,
  RiveFont,
} from "@rive-app/canvas";

// https://rive.app/marketplace/26480-49641-simple-test-text-property/
const RIVE_FILE_URL = new URL(
  "/fallback-fonts-3.riv",
  import.meta.url,
);

const THAI_FALLBACK_FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifthai/NotoSerifThai%5Bwdth%2Cwght%5D.ttf";
const ARABIC_FALLBACK_FONT_URL =
  "./NotoSansArabic-VariableFont_wdth,wght.ttf";

const INITIAL_TEXT_SUFFIX = " สวัสดี AND مرحبا بالعالم";

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  return (await fetch(new Request(url))).arrayBuffer();
}

// Initialize the RiveFont before rendering Rive
// Set fallback fonts with a callback to set a list of fallback fonts
// dynamically for a specific glyph/weight combination
async function initRiveAndShowCanvas(
  riveBytes: ArrayBuffer,
  fonts: Awaited<ReturnType<typeof decodeFont>>[],
) {
  // Set a callback to set fallback fonts when a glyph cannot be rendered
  RiveFont.setFallbackFontCallback((missingGlyph: number, weight: number) => {
    console.log("fallback font missing glyph: ", missingGlyph, " + weight: ", weight);
    return fonts;
  });

  const wrapper = document.getElementById("canvas-wrapper");
  const canvas = document.getElementById("rive-canvas") as HTMLCanvasElement;
  if (!wrapper || !canvas) return;

  wrapper.hidden = false;

  const r = new Rive({
    buffer: riveBytes,
    autoplay: true,
    autoBind: false,
    canvas,
    stateMachines: ["State Machine 1"],
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoad: () => {
      const vm = r.defaultViewModel();
      if (!vm) return;
      const vmi = vm.defaultInstance();
      if (!vmi) return;

      r.bindViewModelInstance(vmi);
      const textProp = vmi.string("text");
      if (textProp) {
        textProp.value = `${textProp.value}${INITIAL_TEXT_SUFFIX}`;
      }
    },
    onLoadError: (error) => {
      console.error("Rive load error", error);
    },
  });

  window.addEventListener("resize", () => {
    r.resizeDrawingSurfaceToCanvas();
  });
}

async function main() {
  const addThaiBtn = document.getElementById("add-thai-font");
  const addArabicBtn = document.getElementById("add-arabic-font");
  const addBothBtn = document.getElementById("add-both-fonts");

  // Pre-fetch assets since we need to decode fonts up front rather than through async load
  const [riveBytes, thaiFontBytes, arabicFontBytes] = await Promise.all([
    fetchArrayBuffer(RIVE_FILE_URL.toString()),
    fetchArrayBuffer(THAI_FALLBACK_FONT_URL),
    fetchArrayBuffer(ARABIC_FALLBACK_FONT_URL),
  ]);

  let initialized = false;

  const handleClick = async (
    getFonts: () => Promise<Awaited<ReturnType<typeof decodeFont>>[]>,
  ) => {
    if (initialized) return;
    initialized = true;

    const fonts = await getFonts();
    await initRiveAndShowCanvas(riveBytes, fonts);

    addThaiBtn?.setAttribute("disabled", "");
    addArabicBtn?.setAttribute("disabled", "");
    addBothBtn?.setAttribute("disabled", "");
  };

  // Decode the font up front before initializing Rive
  addThaiBtn?.addEventListener("click", () =>
    handleClick(async () => {
      const font = await decodeFont(new Uint8Array(thaiFontBytes));
      return [font];
    }),
  );
  addArabicBtn?.addEventListener("click", () =>
    handleClick(async () => {
      const font = await decodeFont(new Uint8Array(arabicFontBytes));
      return [font];
    }),
  );
  addBothBtn?.addEventListener("click", () =>
    handleClick(async () => {
      const [thaiFont, arabicFont] = await Promise.all([
        decodeFont(new Uint8Array(thaiFontBytes)),
        decodeFont(new Uint8Array(arabicFontBytes)),
      ]);
      return [thaiFont, arabicFont];
    }),
  );
}

main();
