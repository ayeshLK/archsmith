import { openSync, type Font } from "fontkit";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Bundled Arimo font files, resolved via normal npm package resolution — no
 * hardcoded system font paths (that was the ATS-prototype's portability bug:
 * it loaded /System/Library/Fonts/Supplemental/Arial{,Bold}.ttf directly,
 * which only exists on macOS, and isn't freely redistributable even there).
 * Arimo is Apache-2.0/OFL and metric-compatible with Arial by design — a
 * direct fontkit measurement comparison against the prototype's own Arial
 * numbers confirmed near-identical advance widths for the same strings.
 */
const ARIMO_FILES = {
  regular: "arimo-latin-400-normal.woff",
  bold: "arimo-latin-700-normal.woff",
} as const;

export type Weight = keyof typeof ARIMO_FILES;

/** Exported so callers that need the actual font bytes (e.g. embedding the
 * font into an output SVG via a base64 @font-face) can locate the same
 * bundled files this module measures against, without duplicating the
 * @fontsource/arimo path-resolution trick. */
export function resolveArimoFile(weight: Weight): string {
  // @fontsource/arimo ships font files under files/ but doesn't expose that
  // subpath via its package.json "exports" map — anchor on package.json,
  // which every package does export, then walk to the sibling files/ dir.
  const pkgJsonUrl = import.meta.resolve("@fontsource/arimo/package.json");
  const pkgRoot = path.dirname(fileURLToPath(pkgJsonUrl));
  return path.join(pkgRoot, "files", ARIMO_FILES[weight]);
}

const fontCache = new Map<Weight, Font>();

/** Loads (and caches) the bundled Arimo font for the given weight class. */
export function loadFont(weight: Weight): Font {
  let font = fontCache.get(weight);
  if (!font) {
    font = openSync(resolveArimoFile(weight)) as Font;
    fontCache.set(weight, font);
  }
  return font;
}

/** Maps a numeric font-weight (as used throughout the schema/renderer, e.g.
 * 400/700) onto which bundled Arimo file to measure against. Only two
 * weights are bundled — anything >= 700 measures as bold, everything else
 * as regular. Matches the ATS prototype's own weight >= 700 threshold. */
export function weightClass(weight: number): Weight {
  return weight >= 700 ? "bold" : "regular";
}
