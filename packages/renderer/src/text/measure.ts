import { loadFont, weightClass } from "./fonts.js";

/**
 * Real glyph-advance-width text measurement, in SVG user units — the direct
 * TypeScript equivalent of the ATS prototype's `text_w()`, but portable (no
 * macOS-only system font path) since it measures against the bundled Arimo
 * font via fontkit instead of PIL + a hardcoded Arial path.
 *
 * No correction factor is applied. The prototype's own `text_w()` carried a
 * *1.07 fudge factor because it measured against Arial (via PIL) but the
 * output SVG's CSS font stack actually rendered as a different font
 * (San Francisco / system-ui) on the machine viewing it — that mismatch is
 * exactly the bug this project's TypeScript rewrite exists to fix. Once
 * measurement and rendering both use the same embedded Arimo font (see
 * svg/embedFonts.ts), the mismatch is gone by construction, and a direct
 * calibration check confirmed it: rendering 20 representative strings
 * (both weights, sizes from 10 to 24, a spread of real punctuation —
 * em dashes, middle dots, quotes, slashes) into an SVG with the font
 * actually embedded and comparing this function's raw output against the
 * browser's own `getComputedTextLength()` gave a ratio of 1.0000-1.0001
 * across every sample — sub-pixel floating-point noise, not a systematic
 * bias. Carrying the old *1.07 forward "to be safe" would have made every
 * measured width ~7% too wide for no reason.
 */
export function measureText(text: string, size: number, weight: number = 400): number {
  const font = loadFont(weightClass(weight));
  const run = font.layout(text);
  return (run.advanceWidth / font.unitsPerEm) * size;
}
