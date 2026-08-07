import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { render } from "./render.js";
import type { DiagramIR } from "./ir.js";

const examplesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../examples");

function loadFixture(relPath: string): unknown {
  return JSON.parse(readFileSync(path.join(examplesDir, relPath), "utf-8"));
}

/**
 * Golden-master regression test: novera.svg is the exact, visually-QA'd
 * (Chrome MCP screenshot + zoom, checked for overflow/overlap/uniform row
 * heights) output for novera.ir.json — a fictional example exercising
 * every schema feature (real Entity Layer, multi-cluster External Systems,
 * a supplied acronym, systems-of-record pills). Any future change to a
 * layout constant, box function, or color resolution that alters this
 * output will fail here, forcing a deliberate re-QA rather than a silent
 * drift — the same role the ATS prototype's own hand-tuned script played
 * during its original pixel-measurement session, now automated.
 */
test("render(novera.ir.json) matches the visually-QA'd golden master", () => {
  const ir = loadFixture("novera.ir.json") as DiagramIR;
  const svg = render(ir);
  const golden = readFileSync(path.join(examplesDir, "novera.svg"), "utf-8");
  assert.equal(svg, golden);
});
