import { test } from "node:test";
import assert from "node:assert/strict";
import { embedFontsInSvg } from "./embedFonts.js";

const MINIMAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">\n<rect x="0" y="0" width="100" height="50"/>\n</svg>`;

test("embeds a @font-face for both regular and bold weights", () => {
  const embedded = embedFontsInSvg(MINIMAL_SVG);
  assert.ok(embedded.includes("font-weight:400"));
  assert.ok(embedded.includes("font-weight:700"));
  assert.equal(embedded.match(/@font-face/g)?.length, 2);
});

test("embeds font data as base64, inside a <style> in <defs>", () => {
  const embedded = embedFontsInSvg(MINIMAL_SVG);
  assert.ok(embedded.includes("<defs><style>"));
  assert.ok(embedded.includes("data:font/woff;base64,"));
});

test("inserts right after the opening <svg> tag, before existing content", () => {
  const embedded = embedFontsInSvg(MINIMAL_SVG);
  const svgTagEnd = embedded.indexOf(">") + 1;
  const afterSvgTag = embedded.slice(svgTagEnd, svgTagEnd + 7);
  assert.equal(afterSvgTag, "\n<defs>");
  assert.ok(embedded.indexOf("<rect") > embedded.indexOf("</defs>"));
});
