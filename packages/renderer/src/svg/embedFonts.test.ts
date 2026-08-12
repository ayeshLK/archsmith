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

test("a subsetText argument embeds a much smaller font than the full font (issue #55)", () => {
  const full = embedFontsInSvg(MINIMAL_SVG);
  const subset = embedFontsInSvg(MINIMAL_SVG, "Hi");
  assert.ok(subset.includes("@font-face"));
  assert.ok(subset.length < full.length / 2, `expected subset (${subset.length}) to be well under half of full (${full.length})`);
});

test("different subsetText produces different-sized embeds — it's not just always embedding the full font", () => {
  const short = embedFontsInSvg(MINIMAL_SVG, "Hi");
  const long = embedFontsInSvg(
    MINIMAL_SVG,
    "The quick brown fox jumps over the lazy dog 0123456789 !@#$%^&*()"
  );
  assert.ok(long.length > short.length);
});

test("full-font embedding still works correctly after a subset call — the subset path doesn't corrupt the full-font cache", () => {
  embedFontsInSvg(MINIMAL_SVG, "Hi");
  const full = embedFontsInSvg(MINIMAL_SVG);
  assert.ok(full.includes("@font-face"));
  assert.equal(full.match(/@font-face/g)?.length, 2);
  assert.ok(full.length > embedFontsInSvg(MINIMAL_SVG, "Hi").length);
});
