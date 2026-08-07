import type { SvgNode } from "../svg/node.js";
import { rect, text } from "../svg/primitives.js";
import { LINE_H, MUTED_C } from "../constants.js";

const PAD = 16;
const TOP_PAD = 26;
const BOTTOM_PAD = 10;

export interface NotesResult {
  height: number;
  nodes: SvgNode[];
}

/**
 * Italic notes/scope callout (bottom-right) — a dashed muted-gray box for
 * caveats a diagram author wants flagged (per arch-diagram-sample-3.png).
 * Purely optional: the caller checks `ir.notes` before calling this at
 * all, since an empty dashed box with nothing in it would be worse than no
 * box. Each entry is one already-authored line (the schema doesn't ask the
 * renderer to wrap these — they're terse, human-written caveats, not free
 * text of arbitrary length).
 */
export function renderNotes(lines: string[], x: number, y: number, w: number): NotesResult {
  const height = TOP_PAD + (lines.length - 1) * LINE_H + BOTTOM_PAD;

  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, height, { fill: "#FFFFFF", stroke: MUTED_C, sw: 1.2, rx: 10, dash: "4 4" }));
  let ny = y + TOP_PAD;
  for (const ln of lines) {
    nodes.push(text(x + PAD, ny, ln, { size: 11.3, weight: 400, fill: MUTED_C, italic: true }));
    ny += LINE_H;
  }

  return { height, nodes };
}
