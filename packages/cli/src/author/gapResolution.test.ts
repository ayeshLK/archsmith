import { test } from "node:test";
import assert from "node:assert/strict";
import type { DraftIR } from "./draftIr.js";
import { subLayerStatus, resolveSubLayerAsAbsent, clearSubLayerGapNote, subLayerGapNote } from "./gapResolution.js";

test("an empty draft's sub-layer status is pending, not absent", () => {
  assert.equal(subLayerStatus("entity-layer", {}), "pending");
});

test("a sub-layer with a real instance is done, regardless of any gap note", () => {
  const draft: DraftIR = {
    columns: { corePlatform: { subLayers: [{ registryId: "entity-layer", rows: [[{ title: "Order" }]] }] } },
  };
  assert.equal(subLayerStatus("entity-layer", draft), "done");
});

test("resolveSubLayerAsAbsent moves a sub-layer from pending to absent", () => {
  const draft: DraftIR = {};
  assert.equal(subLayerStatus("entity-layer", draft), "pending");
  const resolved = resolveSubLayerAsAbsent("entity-layer", "No Entity Layer", "Nothing to model separately here.", draft);
  assert.equal(subLayerStatus("entity-layer", resolved), "absent");
  assert.deepEqual(resolved.unclassified, [
    { title: "No Entity Layer", description: "Nothing to model separately here.", reason: "missing-layer", location: "entity-layer" },
  ]);
});

test("resolveSubLayerAsAbsent replaces an earlier gap note for the same id, not accumulate duplicates", () => {
  let draft: DraftIR = {};
  draft = resolveSubLayerAsAbsent("entity-layer", "First reason", "first", draft);
  draft = resolveSubLayerAsAbsent("entity-layer", "Changed my mind", "second", draft);
  assert.equal(draft.unclassified!.length, 1);
  assert.equal(draft.unclassified![0]!.title, "Changed my mind");
});

test("resolveSubLayerAsAbsent for one sub-layer doesn't touch another's gap note", () => {
  let draft: DraftIR = {};
  draft = resolveSubLayerAsAbsent("entity-layer", "No entity layer", "reason A", draft);
  draft = resolveSubLayerAsAbsent("discovery-and-governance", "No governance layer", "reason B", draft);
  assert.equal(draft.unclassified!.length, 2);
  assert.equal(subLayerStatus("entity-layer", draft), "absent");
  assert.equal(subLayerStatus("discovery-and-governance", draft), "absent");
});

test("clearSubLayerGapNote removes a stale gap note once a real instance exists", () => {
  let draft: DraftIR = resolveSubLayerAsAbsent("entity-layer", "No entity layer", "reason", {});
  assert.equal(draft.unclassified!.length, 1);
  draft = clearSubLayerGapNote("entity-layer", draft);
  assert.equal(draft.unclassified!.length, 0);
});

test("clearSubLayerGapNote is a no-op (same reference) when there's nothing to clear", () => {
  const draft: DraftIR = {};
  assert.equal(clearSubLayerGapNote("entity-layer", draft), draft);
});

test("subLayerGapNote returns the real gap note behind an absent status", () => {
  const draft = resolveSubLayerAsAbsent("entity-layer", "No Entity Layer", "Nothing to model separately here.", {});
  assert.deepEqual(subLayerGapNote("entity-layer", draft), {
    title: "No Entity Layer",
    description: "Nothing to model separately here.",
    reason: "missing-layer",
    location: "entity-layer",
  });
});

test("subLayerGapNote returns undefined for a pending or done sub-layer", () => {
  assert.equal(subLayerGapNote("entity-layer", {}), undefined);
  const done: DraftIR = { columns: { corePlatform: { subLayers: [{ registryId: "entity-layer", rows: [[{ title: "Order" }]] }] } } };
  assert.equal(subLayerGapNote("entity-layer", done), undefined);
});
