import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { DraftIR } from "./draftIr.js";
import { deriveLegendEntries, deriveAbbreviations, deriveColorFamily, governedCoreSubLayers } from "./derived.js";

const examplesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../examples");

function loadFixture(relPath: string): DraftIR {
  return JSON.parse(readFileSync(path.join(examplesDir, relPath), "utf-8")) as DraftIR;
}

test("deriveLegendEntries reproduces ticket-booking's real, already-validated legend exactly", () => {
  const draft = loadFixture("ticket-booking/diagram.archsmith.json");
  const derived = deriveLegendEntries(draft);
  assert.deepEqual(derived, draft.legend!.entries);
});

test("deriveLegendEntries reproduces compliance-heavy-platform's real legend exactly", () => {
  const draft = loadFixture("compliance-heavy-platform/diagram.archsmith.json");
  const derived = deriveLegendEntries(draft);
  assert.deepEqual(derived, draft.legend!.entries);
});

test("governedCoreSubLayers excludes systems-of-record — that's a distinct, always-required section, not one of the optional stacked layers", () => {
  const ids = governedCoreSubLayers().map((e) => e.id);
  assert.deepEqual(ids, ["discovery-and-governance", "execution-and-capability", "entity-layer"]);
});

test("deriveLegendEntries always includes Systems of Record and the gateway entry, even for an empty draft", () => {
  const derived = deriveLegendEntries({});
  assert.deepEqual(derived, [
    { colorToken: "amber", label: "Systems of Record and Knowledge" },
    { colorToken: "mint", label: "Ingress / Egress gateways" },
  ]);
});

test("deriveLegendEntries omits a sub-layer that isn't actually present", () => {
  const draft: DraftIR = {
    columns: {
      corePlatform: {
        subLayers: [{ registryId: "execution-and-capability", rows: [[{ title: "A Service" }]] }],
      },
    },
  };
  const derived = deriveLegendEntries(draft);
  const labels = derived.map((e) => e.label);
  assert.ok(labels.includes("Execution and Capability Layer"));
  assert.ok(!labels.includes("Discovery and Governance"));
  assert.ok(!labels.includes("Entity Layer"));
});

test("deriveAbbreviations reproduces ticket-booking's real abbreviations exactly", () => {
  const draft = loadFixture("ticket-booking/diagram.archsmith.json");
  const derived = deriveAbbreviations(draft);
  assert.deepEqual(derived, draft.legend!.abbreviations ?? []);
});

test("deriveAbbreviations finds an acronym on any item across every column", () => {
  const draft: DraftIR = {
    columns: {
      inboundActors: { items: [{ title: "Web App" }] },
      corePlatform: {
        subLayers: [{ registryId: "execution-and-capability", rows: [[{ title: "A Very Long Service Name", acronym: "AVLSN" }]] }],
        systemsOfRecord: { registryId: "systems-of-record", items: [{ title: "DB" }] },
      },
      externalSystems: { clusters: [{ name: "Cluster", items: [{ title: "Email Service" }] }] },
    },
  };
  assert.deepEqual(deriveAbbreviations(draft), [{ acronym: "AVLSN", fullName: "A Very Long Service Name" }]);
});

test("deriveColorFamily is always standard", () => {
  assert.equal(deriveColorFamily(), "standard");
});
