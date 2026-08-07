import { test } from "node:test";
import assert from "node:assert/strict";
import { measureText } from "./measure.js";

test("measureText returns a positive, size-proportional width", () => {
  const at12 = measureText("Hello World", 12, 700);
  const at24 = measureText("Hello World", 24, 700);
  assert.ok(at12 > 0);
  // Doubling the font size should almost exactly double the measured width —
  // advance-width-per-em scales linearly with size.
  assert.ok(Math.abs(at24 / at12 - 2) < 0.001);
});

test("bold measures wider than regular for the same string", () => {
  const regular = measureText("Email Notifications Service", 12.3, 400);
  const bold = measureText("Email Notifications Service", 12.3, 700);
  assert.ok(bold > regular);
});

test("matches the ATS prototype's own Arial-based measurements closely (same strings, same weight/size)", () => {
  // These are the prototype's real text_w() outputs (Arial via PIL, *1.07),
  // pixel-validated against actual Chrome rendering during that project.
  // Arimo is metric-compatible with Arial by design, so a fontkit-based
  // measurement here should land close, not just "in the same ballpark".
  const cases: Array<[string, number]> = [
    ["Email Notifications Service", 168.96],
    ["Calendar Event Service", 146.3],
    ["HR / People GraphQL Service", 184.32],
  ];
  for (const [text, expected] of cases) {
    const actual = measureText(text, 12.3, 700);
    const pctDiff = Math.abs(actual - expected) / expected;
    assert.ok(pctDiff < 0.02, `${text}: expected ~${expected}, got ${actual.toFixed(2)} (${(pctDiff * 100).toFixed(1)}% off)`);
  }
});
