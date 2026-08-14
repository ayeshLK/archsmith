import type { SvgNode } from "../svg/node.js";
import { rect, text, pill } from "../svg/primitives.js";
import { measureText } from "../text/measure.js";
import { wrapText } from "../text/wrap.js";
import { layoutItemTitle } from "./titleLayout.js";
import { AMBER, AMBER_PILL_BG, BODY_C, GROUP_GAP, INK, LINE_H, MUTED_C, PILL_ROW_H, TITLE_C, TITLE_PILL_GAP } from "../constants.js";
import type { BoxResult } from "./actorBox.js";

export interface ItemBoxPill {
  label: string;
  fg: string;
  bg: string;
}

export interface ItemBoxOptions {
  /** Small italic category label above the title, e.g. "API management". */
  eyebrow?: string | null;
  title: string;
  /** Each entry is a distinct logical thought, auto-wrapped independently —
   * same GROUP_GAP-between-thoughts treatment as actorBox, so a box with
   * multiple description lines never reads as one run-on paragraph just
   * because one of them happened to wrap. */
  descriptionLines: string[];
  pill?: ItemBoxPill | null;
  /** Human-supplied short form (schema's `item.acronym`) — see titleLayout.ts
   * and #68: itemBox previously wrapped a long title with no line cap at
   * all, growing the box without bound instead of ever falling back to
   * this field. */
  acronym?: string | null;
  /** Colors for the mandatory "ACRONYM NEEDED" flag when a title still
   * doesn't fit after wrapping to 2 lines and no acronym was supplied —
   * same default as clusterBox.ts's own acronymFg/acronymBg. */
  acronymFg?: string;
  acronymBg?: string;
  /** Forces the box to render at least this tall, growing the bounding
   * rect without moving any content — never shrinks below the natural
   * height. Exists for uniform-row-height layout: per this project's own
   * established pitfall, boxes sitting side by side in the same row must
   * share one height (the row's tallest natural content), not each be
   * sized to its own. Callers compute the row's max via
   * `itemBoxNaturalHeight` first, then pass it here for every box in
   * that row. */
  minHeight?: number;
}

const PAD = 15;
const EYEBROW_H = 19;
const TITLE_SIZE = 13.5;
const TITLE_TO_DESC_GAP = 3;
const BOTTOM_PAD = 15;

/** Pure height computation, no rendering — lets row-layout code learn every
 * item's natural height first (to find the row's max) before committing to
 * final positions. Kept in exact lockstep with itemBox's own cursor-advance
 * logic below (same constants, same steps) rather than a separately
 * hand-derived formula. */
export function itemBoxNaturalHeight(
  w: number,
  opts: Pick<ItemBoxOptions, "eyebrow" | "title" | "descriptionLines" | "pill" | "acronym">
): number {
  const { eyebrow, title, descriptionLines, pill: pillOpt, acronym } = opts;
  const availW = w - PAD - PAD;
  const { lines: titleLines, pillMode, needsAcronym } = layoutItemTitle(title, acronym, pillOpt?.label, TITLE_SIZE, 700, availW);
  const descGroups = descriptionLines.map((line) => wrapText(line, availW, 11.5, 400));

  let cursorY = PAD + 4;
  if (eyebrow) cursorY += EYEBROW_H;
  cursorY += titleLines.length * LINE_H;
  if (pillMode === "below") cursorY += PILL_ROW_H;
  if (needsAcronym) cursorY += PILL_ROW_H;
  if (descGroups.length > 0) {
    cursorY += TITLE_TO_DESC_GAP;
    descGroups.forEach((group, gi) => {
      cursorY += group.length * LINE_H;
      if (gi < descGroups.length - 1) cursorY += GROUP_GAP;
    });
  }
  return cursorY - LINE_H + BOTTOM_PAD;
}

/**
 * The schema's own `item` `$def` says it "unifies what the ATS reference
 * build called actor_box/detail_box/simple_box" — but the prototype itself
 * never actually built that unification; it kept three separate
 * fixed-height functions, hand-tuned for one example's specific content.
 * This is that unification, built for Phase 3's general layout assembly:
 * a single content-driven box (optional eyebrow, title with optional
 * inline pill, wrapped multi-thought description) used for every Core
 * Platform item — Discovery & Governance, Execution & Capability, Systems
 * of Record alike — instead of three hand-shaped variants.
 *
 * Height is derived by running the same cursor-advance logic used to
 * position content, then reading off the final cursor position — not a
 * separately hand-derived formula. A formula that isn't provably the same
 * arithmetic as the render loop is exactly the class of bug this project
 * has repeatedly caught elsewhere (box heights silently drifting from
 * what's actually drawn).
 */
export function itemBox(x: number, y: number, w: number, opts: ItemBoxOptions): BoxResult {
  const { eyebrow, title, descriptionLines, pill: pillOpt, acronym, acronymFg = AMBER, acronymBg = AMBER_PILL_BG, minHeight = 0 } = opts;
  const availW = w - PAD - PAD;

  const { lines: titleLines, pillMode, needsAcronym } = layoutItemTitle(title, acronym, pillOpt?.label, TITLE_SIZE, 700, availW);
  const descGroups = descriptionLines.map((line) => wrapText(line, availW, 11.5, 400));
  const h = Math.max(itemBoxNaturalHeight(w, opts), minHeight);

  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: "#FFFFFF", stroke: INK, sw: 1.3, rx: 8 }));
  const tx = x + PAD;
  let ty = y + PAD + 4;

  if (eyebrow) {
    nodes.push(text(tx, ty, eyebrow, { size: 11, weight: 400, fill: MUTED_C, italic: true }));
    ty += EYEBROW_H;
  }

  titleLines.forEach((line, i) => {
    nodes.push(text(tx, ty, line, { size: TITLE_SIZE, weight: 700, fill: TITLE_C }));
    if (i === 0 && pillOpt && pillMode === "inline") {
      const pillX = tx + measureText(line, TITLE_SIZE, 700) + TITLE_PILL_GAP;
      const { nodes: pillNodes } = pill(pillX, ty - 14, pillOpt.label, pillOpt.fg, pillOpt.bg);
      nodes.push(...pillNodes);
    }
    ty += LINE_H;
  });

  if (pillMode === "below" && pillOpt) {
    const { nodes: pillNodes } = pill(tx, ty - 14, pillOpt.label, pillOpt.fg, pillOpt.bg);
    nodes.push(...pillNodes);
    ty += PILL_ROW_H;
  }

  if (needsAcronym) {
    const { nodes: acronymNodes } = pill(tx, ty - 14, "ACRONYM NEEDED", acronymFg, acronymBg);
    nodes.push(...acronymNodes);
    ty += PILL_ROW_H;
  }

  if (descGroups.length > 0) {
    ty += TITLE_TO_DESC_GAP;
    descGroups.forEach((group, gi) => {
      for (const line of group) {
        nodes.push(text(tx, ty, line, { size: 11.5, weight: 400, fill: BODY_C }));
        ty += LINE_H;
      }
      if (gi < descGroups.length - 1) ty += GROUP_GAP;
    });
  }

  return { height: h, nodes };
}
