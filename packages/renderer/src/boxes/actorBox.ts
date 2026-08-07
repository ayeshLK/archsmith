import type { SvgNode } from "../svg/node.js";
import { rect, text, dot } from "../svg/primitives.js";
import { wrapText } from "../text/wrap.js";
import { BODY_C, GROUP_GAP, INK, LINE_H, TITLE_C } from "../constants.js";

export interface ActorBoxOptions {
  dotColor: string;
  title: string;
  /** Each entry is a distinct logical thought — auto-wrapped to the box's
   * real content width, never rendered verbatim and hoped to fit. */
  lines: string[];
}

export interface BoxResult {
  height: number;
  nodes: SvgNode[];
}

/**
 * Inbound Actors item box. Direct port of the prototype's `actor_box()`.
 * Wrapped continuation lines within one thought use LINE_H; GROUP_GAP is
 * added once between separate thoughts so wrapping never blurs two
 * distinct statements into what reads as one run-on paragraph. Height is
 * computed from the actual (post-wrap) content, never a fixed
 * caller-supplied number — callers stack boxes using the returned height,
 * not by guessing at the previous one's size.
 */
export function actorBox(x: number, y: number, w: number, opts: ActorBoxOptions): BoxResult {
  const { dotColor, title, lines } = opts;
  const pad = 16;
  const avail = w - pad - pad;
  const groups = lines.map((line) => wrapText(line, avail, 11.8, 400));
  const totalLines = groups.reduce((sum, g) => sum + g.length, 0);
  const h = pad + 6 + 20 + (totalLines - 1) * LINE_H + (groups.length - 1) * GROUP_GAP + 24;

  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: "#FFFFFF", stroke: INK, sw: 1.4, rx: 10 }));
  const tx = x + pad;
  nodes.push(dot(tx + 4, y + pad + 2, dotColor));
  nodes.push(text(tx + 14, y + pad + 6, title, { size: 13.5, weight: 700, fill: TITLE_C }));

  let ly = y + pad + 6 + 20;
  groups.forEach((group, gi) => {
    for (const line of group) {
      nodes.push(text(tx, ly, line, { size: 11.8, weight: 400, fill: BODY_C }));
      ly += LINE_H;
    }
    if (gi < groups.length - 1) ly += GROUP_GAP;
  });

  return { height: h, nodes };
}
