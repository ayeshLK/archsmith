import type { SvgNode } from "../svg/node.js";
import { rect } from "../svg/primitives.js";
import { labelTag } from "./labels.js";

export interface LayerFrameOptions {
  label: string;
  border: string;
  bg: string;
  tag?: string | null;
  tagFg?: string | null;
  tagBg?: string | null;
}

/** Core Platform sub-layer frame (Discovery & Governance, Execution &
 * Capability, etc.) — a solid-bordered, tinted-background box with a
 * label + optional tag pill in its own accent color. Direct port of the
 * prototype's `layer_frame()`. Height is caller-supplied here (the
 * sub-layer's height is decided by its content rows, computed one level up
 * in the full layout assembly — Phase 3), not computed internally. */
export function layerFrame(x: number, y: number, w: number, h: number, opts: LayerFrameOptions): SvgNode[] {
  const { label, border, bg, tag, tagFg, tagBg } = opts;
  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: bg, stroke: border, sw: 1.6, rx: 10 }));
  nodes.push(...labelTag(x + 16, y + 25, label, border, { tag, tagFg, tagBg }));
  return nodes;
}
