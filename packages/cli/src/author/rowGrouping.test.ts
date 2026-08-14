import { test } from "node:test";
import assert from "node:assert/strict";
import type { ItemIR } from "@archsmith/renderer";
import { suggestRowGrouping } from "./rowGrouping.js";

function items(...titles: string[]): ItemIR[] {
  return titles.map((title) => ({ title }));
}

test("an even count pairs sequentially, two per row", () => {
  const rows = suggestRowGrouping(items("A", "B", "C", "D"));
  assert.deepEqual(
    rows.map((r) => r.map((i) => i.title)),
    [["A", "B"], ["C", "D"]]
  );
});

test("an odd count leaves the last item alone on its own row (2-2-1 pattern)", () => {
  const rows = suggestRowGrouping(items("A", "B", "C", "D", "E"));
  assert.deepEqual(
    rows.map((r) => r.map((i) => i.title)),
    [["A", "B"], ["C", "D"], ["E"]]
  );
});

test("a single item is its own row, not paired with nothing", () => {
  const rows = suggestRowGrouping(items("A"));
  assert.deepEqual(rows.map((r) => r.map((i) => i.title)), [["A"]]);
});

test("an empty list produces no rows", () => {
  assert.deepEqual(suggestRowGrouping([]), []);
});
