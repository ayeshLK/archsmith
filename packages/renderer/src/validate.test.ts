import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validate, validateStructure, validateRegistryReferences } from "./validate.js";

const examplesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../examples"
);

function loadFixture(relPath: string): unknown {
  return JSON.parse(readFileSync(path.join(examplesDir, relPath), "utf-8"));
}

test("minimal-valid/diagram.archsmith.json passes full validation", () => {
  const result = validate(loadFixture("minimal-valid/diagram.archsmith.json"));
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("accessible color family is rejected until its palette is complete", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as { colorTheme: { family: string } };
  ir.colorTheme.family = "accessible";

  const result = validateStructure(ir);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("/colorTheme/family")));
});

test("missing-subtitle.archsmith.json fails structural validation with a clear message", () => {
  const ir = loadFixture("broken-examples/missing-subtitle.archsmith.json");
  const structural = validateStructure(ir);
  assert.equal(structural.valid, false);
  assert.ok(structural.errors.some((e) => e.includes("subtitle")));
});

test("unknown-registry-id.archsmith.json passes structural but fails semantic (registry-reference) validation", () => {
  const ir = loadFixture("broken-examples/unknown-registry-id.archsmith.json");
  const structural = validateStructure(ir);
  assert.equal(structural.valid, true);

  const semantic = validateRegistryReferences(ir);
  assert.equal(semantic.valid, false);
  assert.ok(semantic.errors.some((e) => e.includes("orchestration-layer-that-does-not-exist")));

  const full = validate(ir);
  assert.equal(full.valid, false);
});

test("systemsOfRecord.registryId is required (issue #57)", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as {
    columns: { corePlatform: { systemsOfRecord: { registryId?: string } } };
  };
  delete ir.columns.corePlatform.systemsOfRecord.registryId;

  const result = validateStructure(ir);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("systemsOfRecord") && e.includes("registryId")));
});

test("corePlatform.subLayers must include an execution-and-capability entry (issue #89)", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as {
    columns: { corePlatform: { subLayers: Array<{ registryId: string }> } };
  };
  // minimal-valid's only subLayer entry IS execution-and-capability, so
  // swap its registryId rather than removing it outright — the array
  // still has 1 entry (satisfying the schema's own minItems: 1), just no
  // longer the one this test is checking for.
  ir.columns.corePlatform.subLayers[0]!.registryId = "entity-layer";

  const structural = validateStructure(ir);
  assert.equal(structural.valid, true, "a real registry id should pass structural validation");

  const semantic = validateRegistryReferences(ir);
  assert.equal(semantic.valid, false);
  assert.ok(semantic.errors.some((e) => e.includes("execution-and-capability") && e.includes("required")));
});

test("systemsOfRecord.registryId must be exactly 'systems-of-record', not just any known sub-layer id", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as {
    columns: { corePlatform: { systemsOfRecord: { registryId: string } } };
  };
  // "entity-layer" is a real, governed sub-layer id -- structurally valid
  // for subLayers[].registryId, but not for this field, which has exactly
  // one correct value (see corePlatform.ts's lookup).
  ir.columns.corePlatform.systemsOfRecord.registryId = "entity-layer";

  const structural = validateStructure(ir);
  assert.equal(structural.valid, true, "a real registry id should pass structural validation");

  const semantic = validateRegistryReferences(ir);
  assert.equal(semantic.valid, false);
  assert.ok(semantic.errors.some((e) => e.includes("systemsOfRecord.registryId") && e.includes("systems-of-record")));
});
