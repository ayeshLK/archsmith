import type { SvgNode } from "../svg/node.js";
import { rect, text } from "../svg/primitives.js";
import { wrapText } from "../text/wrap.js";
import { BODY_C, LINE_H, MUTED_C } from "../constants.js";

const PAD = 16;
const TITLE_SIZE = 13;
const DESC_SIZE = 11.3;
const TITLE_TO_DESC_GAP = 8;
const BOTTOM_PAD = 16;

export interface GapNoteBoxOptions {
  title: string;
  description: string;
}

/** Deliberately its own type, not actorBox/itemBox/clusterBox's shared
 * BoxResult — a gap note is never about an item or an acronym, so it has
 * no needsAcronym field to (mis)carry, unlike those three (see #68). */
export interface GapNoteBoxResult {
  height: number;
  nodes: SvgNode[];
}

/**
 * The project's "honest gap" convention as a reusable box: a dashed-border
 * note stating plainly that something doesn't exist or wasn't classified,
 * rather than inventing content to fill the space. Used for a missing Core
 * Platform sub-layer (e.g. no Entity Layer) — the same visual pattern the
 * schema's `gapNote` $def generalizes to item-level mismatches too.
 * Height is derived from the same cursor-advance steps used to render, not
 * a separately hand-derived formula.
 */
export function gapNoteBox(x: number, y: number, w: number, opts: GapNoteBoxOptions): GapNoteBoxResult {
  const { title, description } = opts;
  const availW = w - PAD * 2;
  const titleLines = wrapText(title, availW, TITLE_SIZE, 700);
  const descLines = wrapText(description, availW, DESC_SIZE, 400);

  let cursorY = PAD + 4;
  cursorY += titleLines.length * LINE_H;
  cursorY += TITLE_TO_DESC_GAP;
  cursorY += descLines.length * LINE_H;
  const lastLineY = cursorY - LINE_H;
  const h = lastLineY + BOTTOM_PAD;

  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: "#FFFFFF", stroke: MUTED_C, sw: 1.3, rx: 8, dash: "4 4" }));
  let ty = y + PAD + 4;
  for (const line of titleLines) {
    nodes.push(text(x + PAD, ty, line, { size: TITLE_SIZE, weight: 700, fill: BODY_C }));
    ty += LINE_H;
  }
  ty += TITLE_TO_DESC_GAP;
  for (const line of descLines) {
    nodes.push(text(x + PAD, ty, line, { size: DESC_SIZE, weight: 400, fill: MUTED_C }));
    ty += LINE_H;
  }

  return { height: h, nodes };
}
