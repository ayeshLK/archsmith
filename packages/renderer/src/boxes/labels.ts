import type { SvgNode } from "../svg/node.js";
import { text, pill } from "../svg/primitives.js";
import { measureText } from "../text/measure.js";
import { MUTED_C, TITLE_C } from "../constants.js";

export interface LabelTagOptions {
  tag?: string | null;
  tagFg?: string | null;
  tagBg?: string | null;
  size?: number;
  anchor?: "start" | "middle" | "end";
}

/** Left-anchored label with an optional inline pill placed after it,
 * vertically centered. Direct port of the prototype's `label_tag()`. */
export function labelTag(x: number, y: number, label: string, color: string, opts: LabelTagOptions = {}): SvgNode[] {
  const { tag, tagFg, tagBg, size = 12.5, anchor = "start" } = opts;
  const nodes: SvgNode[] = [text(x, y, label.toUpperCase(), { size, weight: 700, fill: color, anchor })];
  if (tag && tagFg && tagBg) {
    const wEst = measureText(label.toUpperCase(), size, 700);
    const px = x + wEst + 16;
    const { nodes: pillNodes } = pill(px, y - 15, tag, tagFg, tagBg);
    nodes.push(...pillNodes);
  }
  return nodes;
}

/** Direct port of the prototype's `col_header()` — the column title
 * ("INBOUND ACTORS", "INGRESS", ...) centered above each of the 5 lanes. */
export function colHeader(cx: number, y: number, title: string, sub?: string | null): SvgNode[] {
  const nodes: SvgNode[] = [text(cx, y, title.toUpperCase(), { size: 13.5, weight: 700, fill: TITLE_C, anchor: "middle" })];
  if (sub) {
    nodes.push(text(cx, y + 17, sub, { size: 12, fill: MUTED_C, anchor: "middle" }));
  }
  return nodes;
}
