import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validate, validateStructure, validateRegistryReferences } from "./validate.js";
import { getRegistry } from "@archsmith/schema";

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

test("legend is optional (issue #101)", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as { legend?: unknown };
  delete ir.legend;

  const result = validate(ir);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("accessible color family is structurally and semantically valid", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as { colorTheme: { family: string } };
  ir.colorTheme.family = "accessible";

  const result = validate(ir);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("active color families contain the same governed token slots", () => {
  const colors = getRegistry("colors") as { families: Record<string, { status: string; layerTokens: Record<string, { border: string; background: string }>; neutralTokens: Record<string, unknown>; semanticPillTokens: Record<string, unknown> }> };
  const standard = colors.families.standard;
  const accessible = colors.families.accessible;
  assert.equal(accessible.status, "active");
  assert.deepEqual(Object.keys(accessible.layerTokens).sort(), Object.keys(standard.layerTokens).sort());
  assert.deepEqual(Object.keys(accessible.neutralTokens).sort(), Object.keys(standard.neutralTokens).sort());
  assert.deepEqual(Object.keys(accessible.semanticPillTokens).sort(), Object.keys(standard.semanticPillTokens).sort());
  assert.deepEqual(accessible.semanticPillTokens.viaEgress, {
    fg: accessible.layerTokens.mint.border,
    bg: accessible.layerTokens.mint.background,
    usage: "matches layerTokens.mint",
  });
});

test("accessible palette meets its minimum contrast contract", () => {
  const colors = getRegistry("colors") as { families: { accessible: { layerTokens: Record<string, { border: string; background: string; pillBackground: string | null }>; semanticPillTokens: Record<string, { fg: string; bg: string }> } } };
  const family = colors.families.accessible;
  const luminance = (hex: string): number => {
    const channels = hex.slice(1).match(/../g)!.map((v) => Number.parseInt(v, 16) / 255);
    const linear = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
  };
  const contrast = (a: string, b: string): number => {
    const l1 = luminance(a);
    const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  for (const token of Object.values(family.layerTokens)) {
    assert.ok(contrast(token.border, token.background) >= 3, `${token.border} on ${token.background} must be at least 3:1`);
    if (token.pillBackground) assert.ok(contrast(token.border, token.pillBackground) >= 4.5);
  }
  for (const token of Object.values(family.semanticPillTokens)) {
    assert.ok(contrast(token.fg, token.bg) >= 4.5, `${token.fg} on ${token.bg} must be at least 4.5:1`);
  }
});

test("unknown item and legend color tokens fail semantic validation", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as { columns: { inboundActors: { items: Array<{ dotColor?: string }> } }; legend?: { entries: Array<{ colorToken: string }> } };
  ir.columns.inboundActors.items[0]!.dotColor = "not-a-color";
  ir.legend!.entries[0]!.colorToken = "not-a-color";
  const result = validateRegistryReferences(ir);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("dotColor")));
  assert.ok(result.errors.some((error) => error.includes("colorToken")));
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
