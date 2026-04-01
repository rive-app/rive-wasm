import * as rc from "../rive_advanced.mjs";
import { RuntimeLoader } from "../runtimeLoader";
import type { FontWrapper } from "./finalizationRegistry";

// Callback type for the fallback fonts callback
export type FallbackFontsCallback = (missingGlyph: number, weight: number) => FontWrapper | FontWrapper[] | null | undefined;

type CallbackToPointerValue = (missingGlyph: number, fallbackFontIndex: number, weight: number) => number | null;

// Class to manage fallback fonts for Rive.
export class RiveFont {
  private static _fallbackFontCallback: FallbackFontsCallback | null = null;

  // Class is never instantiated
  private constructor() {}


  /**
   * Set a callback to dynamically set a list of fallback fonts based on the missing glyph and/or style of the default font.
   * Set null to clear the callback.
   * @param fontCallback Callback to set a list of fallback fonts.
   */
  public static setFallbackFontCallback(fontCallback: FallbackFontsCallback | null): void {
    RiveFont._fallbackFontCallback = fontCallback ?? null;
    RiveFont._wireFallbackProc();
  }

  // Get the pointer value to the Embind Font object from FontWrapper
  private static _fontToPtr(
    fontWrapper: FontWrapper | null | undefined
  ): number | null {
    if (fontWrapper == null) return null;
    const embindFont = fontWrapper.nativeFont as rc.Font;
    const ptr = embindFont?.ptr?.();
    return ptr ?? null;
  }

  private static _getFallbackPtr(
    fonts: FontWrapper[] | null | undefined,
    index: number
  ): number | null {
    if (index < 0 || index >= fonts.length) return null;
    return RiveFont._fontToPtr(fonts![index]);
  }

  // Create the callback Rive expects to use for fallback fonts (regardless if set via a user-supplied static list, or callback)
  // 1. Ensure WASM is ready
  // 2. Bias for checking user callback over static list of fonts and pass it down to Rive to store as reference
  //    - When calling the user callback, check if we have any fonts left to check, and if not, return null to indicate there are no more fallbacks to try.
  //    - If the user callback returns an array of fonts, pass the pointer value to Rive of the font to try
  // 3. If no callback is provided, or the callback returns null, try the static list of fonts if they set any
  // 4. If no fallback method is set, return null.
  private static _wireFallbackProc(): void {
    RuntimeLoader.getInstance((rive: rc.RiveCanvas) => {
      const { _fallbackFontCallback: cb } = RiveFont;
      if (cb) {
        rive.setFallbackFontCallback(
          ((missingGlyph: number, fallbackFontIndex: number, weight: number) => {
            const fontsReturned = cb(missingGlyph, weight);
            if (fontsReturned) {
              if (Array.isArray(fontsReturned)) {
                return RiveFont._getFallbackPtr(
                  fontsReturned,
                  fallbackFontIndex
                );
              }
              // If the user callback only returns a single font, provide it to Rive the first time, otherwise if Rive
              // calls back a second time, return null to indicate there are no more fallbacks to try.
              return fallbackFontIndex === 0 ? RiveFont._fontToPtr(fontsReturned) : null;
            }
            return null;
          }) as CallbackToPointerValue
        );
      } else {
        rive.setFallbackFontCallback(null);
      }
    });
  }
}
