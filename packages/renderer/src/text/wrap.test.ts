import { test } from "node:test";
import assert from "node:assert/strict";
import { wrapText } from "./wrap.js";
import { measureText } from "./measure.js";

function assertNoLineExceeds(lines: string[], maxWidth: number, size: number, weight: number) {
  for (const line of lines) {
    const w = measureText(line, size, weight);
    assert.ok(w <= maxWidth + 0.01, `line "${line}" measures ${w.toFixed(2)}, exceeds maxWidth ${maxWidth}`);
  }
}

test("a short string that fits stays on one line", () => {
  const lines = wrapText("HR / People GraphQL Service", 200, 12.3, 700);
  assert.deepEqual(lines, ["HR / People GraphQL Service"]);
});

test("a long multi-word string wraps to multiple lines, none exceeding maxWidth", () => {
  const text = "Extremely Long Hypothetical Organization-Wide Directory And Provisioning Service";
  const lines = wrapText(text, 200, 12.3, 700);
  assert.ok(lines.length > 1);
  assertNoLineExceeds(lines, 200, 12.3, 700);
  // No word may be silently dropped or duplicated across the wrap.
  assert.equal(lines.join(" "), text);
});

test("a long space-free resource path breaks at secondary delimiters, not mid-character", () => {
  const text = "/api/v1/organizations/{orgId}/employees/{employeeId}/profile-photo";
  const lines = wrapText(text, 200, 11, 400);
  assert.ok(lines.length > 1);
  assertNoLineExceeds(lines, 200, 11, 400);
  assert.equal(lines.join(""), text);
  // Every break should land right after one of the declared secondary
  // delimiters (or at a true hard-cut boundary, but not for this input —
  // it has plenty of "/" to break on).
  for (const line of lines.slice(0, -1)) {
    assert.ok("/-_.?&".includes(line[line.length - 1]!), `line "${line}" doesn't end on a secondary delimiter`);
  }
});

test("a single short word never gets split", () => {
  assert.deepEqual(wrapText("A", 200, 12.3, 700), ["A"]);
});

test("empty string returns a single empty line, not an empty array", () => {
  assert.deepEqual(wrapText("", 200, 12.3, 700), [""]);
});

test("a pathological single word wider than maxWidth with no delimiters hard-cuts via binary search", () => {
  const word = "supercalifragilisticexpialidocious".repeat(2);
  const lines = wrapText(word, 100, 12.3, 700);
  assert.ok(lines.length > 1);
  assertNoLineExceeds(lines, 100, 12.3, 700);
  assert.equal(lines.join(""), word);
});
