import type { SvgNode } from "../svg/node.js";
import type { DiagramIR } from "../ir.js";
import { rect, text, line } from "../svg/primitives.js";
import { resolveLayerToken } from "../registryColors.js";
import { BODY_C, INK, LINE_H, MUTED_C, TITLE_C } from "../constants.js";

const HEADER_H = 26;
const GRID_TOP = 50; // offset from box top to the first swatch row's text baseline
const ROW_H = 26;
const GRID_BOTTOM_PAD = 16;
const ABBREV_GAP = 14;

function swatch(x: number, y: number, fill: string, border: string): SvgNode {
  return rect(x, y, 16, 16, { fill, stroke: border, sw: 1.3, rx: 4 });
}

export interface LegendResult {
  height: number;
  nodes: SvgNode[];
}

/**
 * LEGEND block (bottom-left): a swatch grid for every colorTheme entry the
 * IR declares, plus one fixed trailing entry for the dashed Core Platform
 * boundary (always true regardless of this diagram's own color mapping,
 * so it isn't IR-driven), then — if the IR supplies any — one plain text
 * line per abbreviation spelling out its full name. The exact color-to-
 * label mapping is never fixed across diagrams (sample-3's own legend
 * proves this), so entries are always read from the IR, never hardcoded.
 */
export function renderLegend(ir: DiagramIR, x: number, y: number, w: number, family: string): LegendResult {
  const entries = ir.legend.entries;
  const abbreviations = ir.legend.abbreviations ?? [];

  const totalSlots = entries.length + 1; // +1 for the fixed dashed-boundary note
  const rows = Math.ceil(totalSlots / 2);
  const colW = w / 2 - 20;
  const gridBottom = GRID_TOP + (rows - 1) * ROW_H + GRID_BOTTOM_PAD;

  const abbrevHeight = abbreviations.length > 0 ? ABBREV_GAP + abbreviations.length * LINE_H : 0;
  const height = gridBottom + abbrevHeight;

  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, height, { fill: "#FFFFFF", stroke: INK, sw: 1.4, rx: 10 }));
  nodes.push(text(x + 18, y + HEADER_H, "LEGEND", { size: 13, weight: 700, fill: TITLE_C }));

  const lx = x + 18;
  const ly = y + GRID_TOP;

  entries.forEach((entry, i) => {
    const token = resolveLayerToken(family, entry.colorToken);
    const cx = lx + (i % 2) * colW;
    const cy = ly + Math.floor(i / 2) * ROW_H;
    nodes.push(swatch(cx, cy - 12, token.background, token.border));
    nodes.push(text(cx + 24, cy + 1, entry.label, { size: 11.5, weight: 400, fill: BODY_C }));
  });

  const dashSlot = entries.length;
  const dashCx = lx + (dashSlot % 2) * colW;
  const dashCy = ly + Math.floor(dashSlot / 2) * ROW_H;
  nodes.push(line(dashCx, dashCy - 6, dashCx + 16, dashCy - 6, MUTED_C, 1.6, "4 3"));
  nodes.push(text(dashCx + 24, dashCy + 1, "Dashed border = Core Platform boundary", { size: 11.5, weight: 400, fill: BODY_C }));

  if (abbreviations.length > 0) {
    let ay = y + gridBottom + ABBREV_GAP;
    for (const { acronym, fullName } of abbreviations) {
      nodes.push(text(lx, ay, `${acronym} — ${fullName}`, { size: 11, weight: 400, fill: MUTED_C }));
      ay += LINE_H;
    }
  }

  return { height, nodes };
}
