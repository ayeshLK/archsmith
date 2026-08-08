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
