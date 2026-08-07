import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeNode, serializeNodes, escapeXml } from "./node.js";

test("escapeXml escapes &, <, > only", () => {
  assert.equal(escapeXml("A & B < C > D"), "A &amp; B &lt; C &gt; D");
});

test("serializeNode renders a self-closing element when there's no text", () => {
  const svg = serializeNode({ tag: "rect", attrs: { x: 1, y: 2, width: 10, height: 20 } });
  assert.equal(svg, '<rect x="1" y="2" width="10" height="20"/>');
});

test("serializeNode renders an open/close element with escaped text content", () => {
  const svg = serializeNode({ tag: "text", attrs: { x: 1, y: 2 }, text: "A & B" });
  assert.equal(svg, '<text x="1" y="2">A &amp; B</text>');
});

test("serializeNodes joins multiple nodes", () => {
  const svg = serializeNodes([
    { tag: "rect", attrs: { x: 0 } },
    { tag: "circle", attrs: { cx: 0 } },
  ]);
  assert.equal(svg, '<rect x="0"/>\n<circle cx="0"/>');
});
