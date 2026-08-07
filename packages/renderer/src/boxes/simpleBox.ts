import type { SvgNode } from "../svg/node.js";
import { rect, text, pill } from "../svg/primitives.js";
import { measureText } from "../text/measure.js";
import { BODY_C, INK, TITLE_C, TITLE_PILL_GAP } from "../constants.js";

export interface SimpleBoxOptions {
  title: string;
  lines: string[];
  titlePill?: string | null;
  titlePillFg?: string | null;
  titlePillBg?: string | null;
}

/**
 * Generic labeled box (Execution & Capability services, Systems of Record
 * items) — bold title with an optional inline status pill, then body
 * lines. Ported from the prototype's `simple_box()`, with one deliberate
 * fix: the original placed its title-pill using a flat character-count
 * heuristic (`len(title) * 7.4`) instead of real measurement — the same
 * class of bug this whole project has been fixing everywhere else. Since
 * `measureText`/`TITLE_PILL_GAP` already exist and `clusterBox` already
 * uses them for the equivalent inline-pill placement, this uses the same
 * convention instead of porting the known-inconsistent formula forward.
 */
export function simpleBox(x: number, y: number, w: number, h: number, opts: SimpleBoxOptions): SvgNode[] {
  const { title, lines, titlePill, titlePillFg, titlePillBg } = opts;
  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: "#FFFFFF", stroke: INK, sw: 1.3, rx: 8 }));
  const pad = 15;
  const tx = x + pad;
  let ty = y + pad + 4;
  nodes.push(text(tx, ty, title, { size: 13.5, weight: 700, fill: TITLE_C }));
  if (titlePill && titlePillFg && titlePillBg) {
    const pillX = tx + measureText(title, 13.5, 700) + TITLE_PILL_GAP;
    const { nodes: pillNodes } = pill(pillX, ty - 14, titlePill, titlePillFg, titlePillBg);
    nodes.push(...pillNodes);
  }
  ty += 20;
  for (const line of lines) {
    nodes.push(text(tx, ty, line, { size: 11.5, weight: 400, fill: BODY_C }));
    ty += 17;
  }
  return nodes;
}
