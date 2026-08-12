import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as fontkit from "fontkit";
import type { Font } from "fontkit";
import { subsetWoff } from "./subsetFont.js";
import { resolveArimoFile } from "../text/fonts.js";

const REGULAR_WOFF = readFileSync(resolveArimoFile("regular"));

test("produces a valid, smaller WOFF containing only the requested glyphs", () => {
  const subset = subsetWoff(REGULAR_WOFF, "Hi");
  assert.ok(subset.length < REGULAR_WOFF.length);
  assert.equal(subset.subarray(0, 4).toString("ascii"), "wOFF");

  const font = fontkit.create(subset) as Font;
  for (const ch of "Hi") {
    const glyph = font.glyphForCodePoint(ch.codePointAt(0)!);
    assert.ok(glyph.id !== 0, `expected a real glyph for "${ch}", got .notdef`);
  }
});

test("a larger text corpus produces a larger subset than a smaller one", () => {
  const small = subsetWoff(REGULAR_WOFF, "Hi");
  const large = subsetWoff(REGULAR_WOFF, "The quick brown fox jumps over the lazy dog 0123456789 !@#$%^&*()");
  assert.ok(large.length > small.length);
});

test("is deterministic — same font and text always produce byte-identical output", () => {
  const first = subsetWoff(REGULAR_WOFF, "Determinism check 123");
  const second = subsetWoff(REGULAR_WOFF, "Determinism check 123");
  assert.deepEqual(first, second);
});

test("works for the bold weight too", () => {
  const boldWoff = readFileSync(resolveArimoFile("bold"));
  const subset = subsetWoff(boldWoff, "Bold text");
  const font = fontkit.create(subset) as Font;
  const glyph = font.glyphForCodePoint("B".codePointAt(0)!);
  assert.ok(glyph.id !== 0);
});
