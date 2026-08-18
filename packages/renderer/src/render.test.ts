import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as fontkit from "fontkit";
import type { Font } from "fontkit";
import { render } from "./render.js";
import type { DiagramIR } from "./ir.js";

const examplesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../examples");

function loadFixture(relPath: string): unknown {
  return JSON.parse(readFileSync(path.join(examplesDir, relPath), "utf-8"));
}

/**
 * Golden-master regression test: ticket-booking/diagram.svg is the exact,
 * visually-QA'd (Chrome MCP screenshot + zoom, checked for
 * overflow/overlap/uniform row heights) output for ticket-booking/diagram.archsmith.json —
 * a fictional example exercising every schema feature (real Entity Layer,
 * multi-cluster External Systems, a supplied acronym, systems-of-record
 * pills). Any future change to a layout constant, box function, or color
 * resolution that alters this output will fail here, forcing a deliberate
 * re-QA rather than a silent drift — the same role the ATS prototype's own
 * hand-tuned script played during its original pixel-measurement session,
 * now automated.
 */
test("render(ticket-booking/diagram.archsmith.json) matches the visually-QA'd golden master", () => {
  const ir = loadFixture("ticket-booking/diagram.archsmith.json") as DiagramIR;
  const svg = render(ir);
  const golden = readFileSync(path.join(examplesDir, "ticket-booking/diagram.svg"), "utf-8");
  assert.equal(svg, golden);
});

test("embedFonts defaults to on: the golden master itself carries an embedded @font-face", () => {
  const golden = readFileSync(path.join(examplesDir, "ticket-booking/diagram.svg"), "utf-8");
  assert.ok(golden.includes("@font-face"));
  assert.ok(golden.includes("data:font/woff;base64,"));
});

test("embedFonts: false opts out of the embedded font, producing a smaller SVG with no @font-face", () => {
  const ir = loadFixture("ticket-booking/diagram.archsmith.json") as DiagramIR;
  const svg = render(ir, { embedFonts: false });
  assert.ok(!svg.includes("@font-face"));
  assert.ok(!svg.includes("data:font/woff"));
  // otherwise geometrically identical — same nodes, just without the
  // <defs><style> block prepended by embedFontsInSvg.
  const golden = readFileSync(path.join(examplesDir, "ticket-booking/diagram.svg"), "utf-8");
  assert.ok(golden.length > svg.length);
});

test("omitting legend removes the Legend block and its unused footer space (issue #101)", () => {
  const withLegend = loadFixture("minimal-valid/diagram.archsmith.json") as DiagramIR;
  const withLegendSvg = render(withLegend, { embedFonts: false });
  const withoutLegend = structuredClone(withLegend);
  delete withoutLegend.legend;
  const withoutLegendSvg = render(withoutLegend, { embedFonts: false });

  assert.ok(withLegendSvg.includes(">LEGEND</text>"));
  assert.ok(!withoutLegendSvg.includes(">LEGEND</text>"));
  assert.ok(!withoutLegendSvg.includes("Dashed border = Core Platform boundary"));

  const height = (svg: string): number => Number(svg.match(/<svg[^>]+ height="([0-9.]+)"/)?.[1]);
  assert.ok(height(withoutLegendSvg) < height(withLegendSvg));
});

test("corePlatform.systemsOfRecord.registryId genuinely drives the styling lookup, not just a decorative field (issue #57)", () => {
  // Confirms the field is wired to the actual render, not merely validated
  // and ignored: pointing it at a different real registry entry (bypassing
  // validation, which would normally reject this) changes the rendered
  // accent color/tag to that entry's, proving corePlatform.ts reads
  // core.systemsOfRecord.registryId rather than a hardcoded literal.
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as DiagramIR;
  const defaultSvg = render(ir, { skipValidate: true, embedFonts: false });
  assert.ok(defaultSvg.includes("SYSTEMS OF RECORD"));

  ir.columns.corePlatform.systemsOfRecord.registryId = "entity-layer";
  const retitledSvg = render(ir, { skipValidate: true, embedFonts: false });
  assert.ok(retitledSvg.includes("ENTITY LAYER"), "expected the section label to follow the registryId to entity-layer");
  assert.ok(!retitledSvg.includes("SYSTEMS OF RECORD"));
});

function extractEmbeddedRegularFont(svg: string): Font {
  const match = svg.match(/@font-face\{font-family:'Arimo';src:url\(data:font\/woff;base64,([^)]+)\) format\('woff'\);font-weight:400;/);
  assert.ok(match, "expected an embedded regular-weight @font-face");
  return fontkit.create(Buffer.from(match![1], "base64")) as Font;
}

test("embedded font is subset to the diagram's own text (issue #55) — smaller diagrams embed smaller fonts", () => {
  const minimal = render(loadFixture("minimal-valid/diagram.archsmith.json") as DiagramIR);
  const ticketBooking = render(loadFixture("ticket-booking/diagram.archsmith.json") as DiagramIR);
  const minimalFontSize = minimal.match(/base64,([^)]+)\)/)![1].length;
  const ticketBookingFontSize = ticketBooking.match(/base64,([^)]+)\)/)![1].length;
  assert.ok(
    ticketBookingFontSize > minimalFontSize,
    "ticket-booking has far more text than minimal-valid, so its embedded font subset should be larger"
  );
});

// #68/#67 Phase 0: render()'s returnMeta option, aggregating needsAcronym
// from every item across all three columns (Inbound Actors, Core Platform,
// External Systems) — the actual prerequisite for archsmith author's
// acronym-fixup flow.
const LONG_TITLE = "Extremely Long Hypothetical Organization Wide Directory And Employee Provisioning Synchronization Service";
// Core Platform's single-item row is far wider than Inbound Actors' column
// (roughly 800px vs. 230px available) — LONG_TITLE alone wraps to exactly 2
// lines there, not >2, so it needs real repetition to actually overflow.
const LONG_TITLE_CORE = `${LONG_TITLE} ${LONG_TITLE} ${LONG_TITLE}`;

test("render() without returnMeta still returns a plain string (default, unaffected by this option existing)", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as DiagramIR;
  const result = render(ir);
  assert.equal(typeof result, "string");
});

test("returnMeta: true returns { svg, needsAcronym }, with needsAcronym empty when nothing overflows", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as DiagramIR;
  const result = render(ir, { returnMeta: true });
  assert.equal(typeof result.svg, "string");
  assert.deepEqual(result.needsAcronym, []);
});

test("a title too long even after wrapping (Core Platform) is surfaced in needsAcronym", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as DiagramIR;
  ir.columns.corePlatform.subLayers[0]!.rows[0]![0]!.title = LONG_TITLE_CORE;
  const { svg, needsAcronym } = render(ir, { returnMeta: true });
  assert.deepEqual(needsAcronym, [LONG_TITLE_CORE]);
  assert.ok(svg.includes("ACRONYM NEEDED"));
});

test("needsAcronym aggregates across columns, not just one — Inbound Actors and Core Platform together", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as DiagramIR;
  const inboundLongTitle = LONG_TITLE + " (Inbound)";
  ir.columns.inboundActors.items[0]!.title = inboundLongTitle;
  ir.columns.corePlatform.subLayers[0]!.rows[0]![0]!.title = LONG_TITLE_CORE;
  const { needsAcronym } = render(ir, { returnMeta: true });
  assert.deepEqual(new Set(needsAcronym), new Set([inboundLongTitle, LONG_TITLE_CORE]));
});

test("a supplied item.acronym resolves the overflow — no longer in needsAcronym", () => {
  const ir = loadFixture("minimal-valid/diagram.archsmith.json") as DiagramIR;
  ir.columns.corePlatform.subLayers[0]!.rows[0]![0]!.title = LONG_TITLE_CORE;
  ir.columns.corePlatform.subLayers[0]!.rows[0]![0]!.acronym = "EWDPS";
  const { needsAcronym } = render(ir, { returnMeta: true });
  assert.deepEqual(needsAcronym, []);
});

test("the embedded subset font actually has real glyphs for every character in the diagram's title and subtitle", () => {
  const ir = loadFixture("ticket-booking/diagram.archsmith.json") as DiagramIR;
  const svg = render(ir);
  const font = extractEmbeddedRegularFont(svg);
  for (const ch of `${ir.title}${ir.subtitle ?? ""}`) {
    if (ch === " ") continue;
    const glyph = font.glyphForCodePoint(ch.codePointAt(0)!);
    assert.ok(glyph.id !== 0, `expected a real glyph for "${ch}" (from title/subtitle), got .notdef`);
  }
});
