import { readFileSync } from "node:fs";
import { resolveArimoFile, type Weight } from "../text/fonts.js";

const FONT_WEIGHTS: Array<{ weight: Weight; cssWeight: number }> = [
  { weight: "regular", cssWeight: 400 },
  { weight: "bold", cssWeight: 700 },
];

let cachedStyleBlock: string | undefined;

function buildFontFaceStyle(): string {
  if (cachedStyleBlock) return cachedStyleBlock;
  const faces = FONT_WEIGHTS.map(({ weight, cssWeight }) => {
    const bytes = readFileSync(resolveArimoFile(weight));
    const base64 = bytes.toString("base64");
    return `@font-face{font-family:'Arimo';src:url(data:font/woff;base64,${base64}) format('woff');font-weight:${cssWeight};font-style:normal;}`;
  });
  cachedStyleBlock = `<defs><style>${faces.join("")}</style></defs>`;
  return cachedStyleBlock;
}

/**
 * Embeds the same bundled Arimo font text() is measured against directly
 * into the SVG, as a base64 @font-face — the concrete fix for the
 * measure-vs-render gap this project's TypeScript rewrite exists to close
 * (the Python prototype measured against Arial via PIL but declared a CSS
 * system-font stack that actually renders as something else on most
 * machines). This makes a rendered diagram look identical everywhere,
 * regardless of what's installed locally, at the cost of ~40KB of embedded
 * font data (two weights, woff format) — small next to a typical diagram.
 * Inserted right after the opening `<svg ...>` tag; nodes are otherwise
 * untouched, so this is a pure post-process on the serialized string, not a
 * renderer-internal concern.
 */
export function embedFontsInSvg(svg: string): string {
  const styleBlock = buildFontFaceStyle();
  const insertAt = svg.indexOf(">") + 1;
  return svg.slice(0, insertAt) + "\n" + styleBlock + svg.slice(insertAt);
}
