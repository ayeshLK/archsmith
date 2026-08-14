import type { SvgNode } from "../svg/node.js";
import { rect, text, dot, pill } from "../svg/primitives.js";
import { wrapText } from "../text/wrap.js";
import { layoutItemTitle } from "./titleLayout.js";
import { AMBER, AMBER_PILL_BG, BODY_C, GROUP_GAP, INK, LINE_H, PILL_ROW_H, TITLE_C } from "../constants.js";

export interface ActorBoxOptions {
  dotColor: string;
  title: string;
  /** Each entry is a distinct logical thought — auto-wrapped to the box's
   * real content width, never rendered verbatim and hoped to fit. */
  lines: string[];
  /** Human-supplied short form (schema's `item.acronym`) — see titleLayout.ts
   * and #68: actorBox previously never wrapped its title at all, so a long
   * one just overflowed the box invisibly. */
  acronym?: string | null;
  /** Colors for the mandatory "ACRONYM NEEDED" flag — same default as
   * itemBox.ts/clusterBox.ts's own acronymFg/acronymBg. */
  acronymFg?: string;
  acronymBg?: string;
}

export interface BoxResult {
  height: number;
  nodes: SvgNode[];
  /** Titles of items rendered by this call that still didn't fit after
   * wrapping to 2 lines and had no `acronym` supplied — see titleLayout.ts
   * and #68. Bubbled up through every layout file so render()'s own
   * needsAcronym signal (issue #67's Phase 0) has one real source, not a
   * guess. Empty when nothing in this call needed one. */
  needsAcronym: string[];
}

/**
 * Inbound Actors item box. Direct port of the prototype's `actor_box()`,
 * extended per #68 to wrap a too-long title (capped at 2 lines, falling
 * back to a human-supplied acronym or flagging "ACRONYM NEEDED" — see
 * titleLayout.ts) rather than rendering it as one unwrapped line. Wrapped
 * continuation lines within one description thought use LINE_H; GROUP_GAP
 * is added once between separate thoughts so wrapping never blurs two
 * distinct statements into what reads as one run-on paragraph. Height is
 * computed from the actual (post-wrap) content, never a fixed
 * caller-supplied number — callers stack boxes using the returned height,
 * not by guessing at the previous one's size.
 */
export function actorBox(x: number, y: number, w: number, opts: ActorBoxOptions): BoxResult {
  const { dotColor, title, lines, acronym, acronymFg = AMBER, acronymBg = AMBER_PILL_BG } = opts;
  const pad = 16;
  const avail = w - pad - pad;

  const { lines: titleLines, needsAcronym: needsAcronymFlag } = layoutItemTitle(title, acronym, null, 13.5, 700, avail);
  const groups = lines.map((line) => wrapText(line, avail, 11.8, 400));
  const totalLines = groups.reduce((sum, g) => sum + g.length, 0);

  // The original formula's "20" is the fixed baseline for exactly one
  // title line (pixel-verified against the reference templates) — kept
  // untouched here; any *additional* wrapped title line adds LINE_H, the
  // same per-line cost used everywhere else in this function, and a
  // needed acronym flag adds its own PILL_ROW_H, same as itemBox/clusterBox.
  const extraTitleLines = titleLines.length - 1;
  const acronymH = needsAcronymFlag ? PILL_ROW_H : 0;
  const h =
    pad + 6 + 20 + extraTitleLines * LINE_H + acronymH + (totalLines - 1) * LINE_H + (groups.length - 1) * GROUP_GAP + 24;

  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: "#FFFFFF", stroke: INK, sw: 1.4, rx: 10 }));
  const tx = x + pad;
  nodes.push(dot(tx + 4, y + pad + 2, dotColor));

  let ty = y + pad + 6;
  titleLines.forEach((line) => {
    nodes.push(text(tx + 14, ty, line, { size: 13.5, weight: 700, fill: TITLE_C }));
    ty += LINE_H;
  });
  // Restore the same 20px (not LINE_H's 17px) gap the original, untouched
  // single-title-line case used before the first description line.
  ty += 20 - LINE_H;

  if (needsAcronymFlag) {
    const { nodes: acronymNodes } = pill(tx + 14, ty - 14, "ACRONYM NEEDED", acronymFg, acronymBg);
    nodes.push(...acronymNodes);
    ty += PILL_ROW_H;
  }

  let ly = ty;
  groups.forEach((group, gi) => {
    for (const line of group) {
      nodes.push(text(tx, ly, line, { size: 11.8, weight: 400, fill: BODY_C }));
      ly += LINE_H;
    }
    if (gi < groups.length - 1) ly += GROUP_GAP;
  });

  return { height: h, nodes, needsAcronym: needsAcronymFlag ? [title] : [] };
}
