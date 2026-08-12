import { readFileSync } from "node:fs";
import { resolveArimoFile, type Weight } from "../text/fonts.js";
import { subsetWoff } from "./subsetFont.js";

const FONT_WEIGHTS: Array<{ weight: Weight; cssWeight: number }> = [
  { weight: "regular", cssWeight: 400 },
  { weight: "bold", cssWeight: 700 },
];

let cachedFullStyleBlock: string | undefined;

function buildFontFaceStyle(subsetText: string | undefined): string {
  // Full-font embedding is diagram-independent, so it's cached once, same
  // as before subsetting existed. Subsetted embedding depends on this
  // specific diagram's text, so it can't share that cache.
  if (subsetText === undefined && cachedFullStyleBlock) return cachedFullStyleBlock;
  const faces = FONT_WEIGHTS.map(({ weight, cssWeight }) => {
    const bytes = readFileSync(resolveArimoFile(weight));
    const woffBytes = subsetText === undefined ? bytes : subsetWoff(bytes, subsetText);
    const base64 = woffBytes.toString("base64");
    return `@font-face{font-family:'Arimo';src:url(data:font/woff;base64,${base64}) format('woff');font-weight:${cssWeight};font-style:normal;}`;
  });
  const styleBlock = `<defs><style>${faces.join("")}</style></defs>`;
  if (subsetText === undefined) cachedFullStyleBlock = styleBlock;
  return styleBlock;
}

/**
 * Embeds the same bundled Arimo font text() is measured against directly
 * into the SVG, as a base64 @font-face — the concrete fix for the
 * measure-vs-render gap this project's TypeScript rewrite exists to close
 * (the Python prototype measured against Arial via PIL but declared a CSS
 * system-font stack that actually renders as something else on most
 * machines). This makes a rendered diagram look identical everywhere,
 * regardless of what's installed locally. Inserted right after the opening
 * `<svg ...>` tag; nodes are otherwise untouched, so this is a pure
 * post-process on the serialized string, not a renderer-internal concern.
 *
 * `subsetText`, when given, embeds only the glyphs that text actually
 * needs (see subsetFont.ts) instead of the complete font — the embedded
 * font was previously a fixed ~40KB regardless of diagram content (see
 * issue #55), since every render() call spliced in the whole font whether
 * the diagram needed most of its glyph coverage or not. Callers that pass
 * their diagram's actual rendered text get a file sized to what they
 * actually drew. Omit it (or call this directly with one argument, as
 * existing callers do) to keep the previous full-font behavior.
 */
export function embedFontsInSvg(svg: string, subsetText?: string): string {
  const styleBlock = buildFontFaceStyle(subsetText);
  const insertAt = svg.indexOf(">") + 1;
  return svg.slice(0, insertAt) + "\n" + styleBlock + svg.slice(insertAt);
}
