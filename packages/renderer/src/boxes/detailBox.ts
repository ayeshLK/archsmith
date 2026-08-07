import type { SvgNode } from "../svg/node.js";
import { rect, text } from "../svg/primitives.js";
import { BODY_C, INK, MUTED_C, TITLE_C } from "../constants.js";

export interface DetailBoxOptions {
  category: string;
  title: string;
  systemLine: string;
  detailLine: string;
}

/** Discovery & Governance's detail boxes (API Control Plane, Governance
 * and Policy) — an italic eyebrow category, bold title, then two body
 * lines. Direct port of the prototype's `detail_box()`. Fixed height
 * (caller-supplied) since its content is always exactly this shape;
 * unlike actorBox/clusterBox there's no variable line count to compute
 * from here. */
export function detailBox(x: number, y: number, w: number, h: number, opts: DetailBoxOptions): SvgNode[] {
  const { category, title, systemLine, detailLine } = opts;
  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: "#FFFFFF", stroke: INK, sw: 1.3, rx: 8 }));
  const pad = 15;
  const tx = x + pad;
  let ty = y + pad + 4;
  nodes.push(text(tx, ty, category, { size: 11, weight: 400, fill: MUTED_C, italic: true }));
  ty += 19;
  nodes.push(text(tx, ty, title, { size: 14, weight: 700, fill: TITLE_C }));
  ty += 21;
  nodes.push(text(tx, ty, systemLine, { size: 11.5, weight: 400, fill: BODY_C }));
  ty += 17;
  nodes.push(text(tx, ty, detailLine, { size: 11.2, weight: 400, fill: MUTED_C }));
  return nodes;
}
