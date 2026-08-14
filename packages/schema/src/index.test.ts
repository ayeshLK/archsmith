import { test } from "node:test";
import assert from "node:assert/strict";
import { getAuthoringGlossary, getAuthoringHint, listRegistryNames, getRegistry } from "./index.js";

test("getAuthoringGlossary returns a real, non-empty entry list", () => {
  const entries = getAuthoringGlossary();
  assert.ok(entries.length > 0);
  for (const entry of entries) {
    assert.equal(typeof entry.id, "string");
    assert.equal(typeof entry.hint, "string");
    assert.ok(entry.hint.length > 0);
  }
});

test("getAuthoringGlossary has an entry for every column and every governed sub-layer", () => {
  const ids = getAuthoringGlossary().map((e) => e.id);
  for (const columnId of ["inboundActors", "ingress", "corePlatform", "egress", "externalSystems"]) {
    assert.ok(ids.includes(columnId), `missing glossary entry for column "${columnId}"`);
  }
  const subLayerIds = (getRegistry("sub-layers") as { entries: { id: string }[] }).entries.map((e) => e.id);
  for (const subLayerId of subLayerIds) {
    assert.ok(ids.includes(subLayerId), `missing glossary entry for sub-layer "${subLayerId}"`);
  }
});

test("getAuthoringHint returns the matching entry's hint", () => {
  const hint = getAuthoringHint("ingress");
  const entries = getAuthoringGlossary();
  assert.equal(hint, entries.find((e) => e.id === "ingress")!.hint);
});

test("getAuthoringHint throws a clear error for an unknown id, rather than returning undefined silently", () => {
  assert.throws(() => getAuthoringHint("not-a-real-id"), /no authoring-glossary entry for "not-a-real-id"/);
});

test("listRegistryNames does not include the authoring glossary — it isn't governed vocabulary", () => {
  assert.ok(!listRegistryNames().includes("authoring-glossary" as never));
});
