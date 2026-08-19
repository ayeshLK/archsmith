import { test } from "node:test";
import assert from "node:assert/strict";
import type { DiagramIR } from "@archsmith/renderer";
import { applyAcronyms } from "./acronymFixup.js";

function baseIr(): DiagramIR {
  return {
    schemaVersion: "0.3.4",
    title: "T",
    subtitle: "S",
    colorTheme: { family: "standard" },
    columns: {
      inboundActors: { items: [{ title: "Actor A" }, { title: "Actor B" }] },
      ingress: { gateway: { label: "Ingress" } },
      corePlatform: {
        deployedOn: "AWS",
        subLayers: [
          { registryId: "execution-and-capability", rows: [[{ title: "Service A" }, { title: "Service B" }]] },
        ],
        systemsOfRecord: { registryId: "systems-of-record", items: [{ title: "DB A" }] },
      },
      egress: { gateway: { label: "Egress" } },
      externalSystems: { clusters: [{ name: "Cluster A", items: [{ title: "Ext A" }, { title: "Ext B" }] }] },
    },
  };
}

test("empty needsAcronym returns the same IR untouched", () => {
  const ir = baseIr();
  const result = applyAcronyms(ir, [], []);
  assert.equal(result, ir);
});

test("resolves a single flagged item, leaving every other item untouched", () => {
  const ir = baseIr();
  const result = applyAcronyms(ir, ["Service B"], ["SVC-B"]);
  assert.equal(result.columns.corePlatform.subLayers[0]!.rows[0]![0]!.acronym, undefined);
  assert.equal(result.columns.corePlatform.subLayers[0]!.rows[0]![1]!.acronym, "SVC-B");
  assert.equal(result.columns.inboundActors.items[0]!.acronym, undefined);
});

test("resolves items across every column in the same order render() aggregates them", () => {
  const ir = baseIr();
  const needsAcronym = ["Actor B", "Service A", "DB A", "Ext B"];
  const answers = ["ACT-B", "SVC-A", "DB-A", "EXT-B"];
  const result = applyAcronyms(ir, needsAcronym, answers);
  assert.equal(result.columns.inboundActors.items[1]!.acronym, "ACT-B");
  assert.equal(result.columns.corePlatform.subLayers[0]!.rows[0]![0]!.acronym, "SVC-A");
  assert.equal(result.columns.corePlatform.systemsOfRecord.items[0]!.acronym, "DB-A");
  assert.equal(result.columns.externalSystems.clusters[0]!.items[1]!.acronym, "EXT-B");
});

test("a blank answer (skip) leaves the item's acronym unset, but still consumes its slot", () => {
  const ir = baseIr();
  const result = applyAcronyms(ir, ["Actor A", "Actor B"], ["", "ACT-B"]);
  assert.equal(result.columns.inboundActors.items[0]!.acronym, undefined);
  assert.equal(result.columns.inboundActors.items[1]!.acronym, "ACT-B");
});

test("duplicate titles are disambiguated positionally, not by name alone", () => {
  const ir = baseIr();
  ir.columns.inboundActors.items = [{ title: "Same Title" }, { title: "Same Title" }];
  const result = applyAcronyms(ir, ["Same Title", "Same Title"], ["FIRST", "SECOND"]);
  assert.equal(result.columns.inboundActors.items[0]!.acronym, "FIRST");
  assert.equal(result.columns.inboundActors.items[1]!.acronym, "SECOND");
});

test("does not mutate the original IR", () => {
  const ir = baseIr();
  const original = JSON.parse(JSON.stringify(ir));
  applyAcronyms(ir, ["Actor A"], ["ACT-A"]);
  assert.deepEqual(ir, original);
});
