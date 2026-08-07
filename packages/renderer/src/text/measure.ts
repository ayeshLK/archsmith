import { loadFont, weightClass } from "./fonts.js";

/**
 * Empirical correction factor carried forward from the ATS prototype's own
 * Arial-based measurement (`text_w()`, *1.07) rather than re-derived from
 * scratch — a direct fontkit comparison against Arial confirmed Arimo's raw
 * advance widths are nearly identical to Arial's for the same strings (e.g.
 * "Email Notifications Service": 157.91 here vs 157.92 there), so the same
 * correction should still roughly apply. This is a carried-forward starting
 * point, not a final value: per the project plan, Phase 6 re-derives it
 * empirically via a headless-browser calibration harness once font embedding
 * closes the measure-vs-render loop properly. Until then, this is a real
 * measurement-engine output times a documented-but-unverified-for-this-font
 * fudge factor — better than a flat heuristic, not yet fully calibrated.
 */
const CORRECTION = 1.07;

/**
 * Real glyph-advance-width text measurement, in SVG user units — the direct
 * TypeScript equivalent of the ATS prototype's `text_w()`, but portable (no
 * macOS-only system font path) since it measures against the bundled Arimo
 * font via fontkit instead of PIL + a hardcoded Arial path.
 */
export function measureText(text: string, size: number, weight: number = 400): number {
  const font = loadFont(weightClass(weight));
  const run = font.layout(text);
  return (run.advanceWidth / font.unitsPerEm) * size * CORRECTION;
}
