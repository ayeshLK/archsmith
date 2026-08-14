import type { SvgNode } from "../svg/node.js";
import type { DiagramIR } from "../ir.js";
import { rect } from "../svg/primitives.js";
import { actorBox } from "../boxes/actorBox.js";
import { resolveDotColor } from "./resolveItem.js";
import { SOFT_DIVIDER } from "../constants.js";

const OUTER_FRAME_INSET = 12;
const ITEM_GAP = 20;

export interface InboundActorsResult {
  /** Natural content height — what render.ts uses as one input to the
   * shared FRAME_H it computes across all three variable-height columns. */
  height: number;
  nodes: SvgNode[];
  needsAcronym: string[];
}

/**
 * Inbound Actors column: a soft-gray outer frame (per
 * base-arch-diagram-template.png / arch-diagram-sample-3.png — an adopted
 * convention, not present in every reference sample) around stacked
 * actorBoxes. Content is always top-anchored; `frameHeight`, when supplied,
 * only stretches the decorative outer frame rect to match the tallest
 * sibling column — it never repositions content, matching the same
 * pattern the prototype's shared fixed FRAME_H established.
 */
export function renderInboundActors(ir: DiagramIR, x: number, frameY: number, w: number, family: string, frameHeight?: number): InboundActorsResult {
  const bx = x + OUTER_FRAME_INSET;
  const bw = w - OUTER_FRAME_INSET * 2;

  const nodes: SvgNode[] = [];
  const needsAcronym: string[] = [];
  let by = frameY + OUTER_FRAME_INSET;
  for (const item of ir.columns.inboundActors.items) {
    const { height, nodes: boxNodes, needsAcronym: boxAcronym } = actorBox(bx, by, bw, {
      dotColor: resolveDotColor(item, family),
      title: item.title,
      lines: item.descriptionLines ?? [],
      acronym: item.acronym ?? null,
    });
    nodes.push(...boxNodes);
    needsAcronym.push(...boxAcronym);
    by += height + ITEM_GAP;
  }
  const naturalHeight = by - ITEM_GAP + OUTER_FRAME_INSET - frameY;

  const outerH = frameHeight ?? naturalHeight;
  const outerFrame = rect(x, frameY, w, outerH, { fill: "#FFFFFF", stroke: SOFT_DIVIDER, sw: 1.4, rx: 10 });

  return { height: naturalHeight, nodes: [outerFrame, ...nodes], needsAcronym };
}
