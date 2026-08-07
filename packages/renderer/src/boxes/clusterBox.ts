import type { SvgNode } from "../svg/node.js";
import { rect, text, dot, pill, pillWidth, line } from "../svg/primitives.js";
import { measureText } from "../text/measure.js";
import { wrapText } from "../text/wrap.js";
import {
  AMBER,
  AMBER_PILL_BG,
  MAX_INLINE_WIDTH,
  MUTED_C,
  PILL_ROW_H,
  SOFT_DIVIDER,
  TITLE_C,
  TITLE_LINE_H,
  TITLE_PILL_GAP,
} from "../constants.js";

export interface ClusterItem {
  color: string;
  title: string;
  sub: string;
  pill?: string | null;
  /** Human-supplied short form (schema's `item.acronym`). Used in place of
   * `title` when the full title doesn't fit inline — this is the piece the
   * ATS prototype never actually wired up (no real content ever hit that
   * tier), even though the schema always required it: "used in the box in
   * place of title... a human call, never invented by the renderer." */
  acronym?: string | null;
}

interface ItemLayout {
  lines: string[];
  pillMode: "inline" | "below" | "none";
  needsAcronym: boolean;
}

/**
 * Decide how one item's title+pill renders within availWidth (content
 * width, padding already excluded). Three tiers: single line inline;
 * wrapped to <=2 lines with the pill moved below; or a hard-limit flag if
 * even 2 lines can't fit — that last case needs a human-supplied acronym,
 * never a renderer guess. Direct port of the prototype's `_item_layout`.
 */
function itemLayout(item: ClusterItem, availWidth: number): ItemLayout {
  const { title, acronym } = item;
  let singleLineW = measureText(title, 12.3, 700);
  if (item.pill) {
    singleLineW += TITLE_PILL_GAP + pillWidth(item.pill);
  }
  if (singleLineW <= availWidth) {
    return { lines: [title], pillMode: "inline", needsAcronym: false };
  }

  // Full title doesn't fit inline. If a human has already supplied an
  // acronym, use it — that's the whole point of the field, and it takes
  // priority over wrapping the full title. Not fit-checked against
  // availWidth: acronyms are expected to be short by construction (that's
  // the human's job to get right), and re-litigating the human's choice
  // here (e.g. falling back to wrapping it) isn't the renderer's call.
  if (acronym) {
    return { lines: [acronym], pillMode: "inline", needsAcronym: false };
  }

  const wrapped = wrapText(title, availWidth, 12.3, 700);
  const needsAcronym = wrapped.length > 2;
  return {
    lines: needsAcronym ? wrapped.slice(0, 2) : wrapped,
    pillMode: item.pill ? "below" : "none",
    needsAcronym,
  };
}

/** Direct port of the prototype's `_item_height`. */
function itemHeight(layout: ItemLayout): number {
  const linesH = layout.lines.length * TITLE_LINE_H;
  const pillH = layout.pillMode === "below" ? PILL_ROW_H : 0;
  const acronymH = layout.needsAcronym ? PILL_ROW_H : 0;
  return 52 + (linesH - TITLE_LINE_H) + pillH + acronymH; // 52 = tier-1 baseline row height
}

/**
 * Minimum box width that fits every item's title + inline pill on one
 * line, plus the cluster title itself — capped at MAX_INLINE_WIDTH; items
 * that would exceed it wrap instead of growing the box further. The box is
 * sized to the content, never the other way around. Direct port of the
 * prototype's `cluster_content_width`.
 */
export function clusterContentWidth(title: string, items: ClusterItem[], pad: number = 16): number {
  const needed = [pad + 16 + measureText(title, 13.5, 700) + pad];
  for (const item of items) {
    let w = pad + 16 + measureText(item.title, 12.3, 700);
    if (item.pill) {
      w += TITLE_PILL_GAP + pillWidth(item.pill);
    }
    needed.push(w + pad);
  }
  return Math.max(260, Math.min(MAX_INLINE_WIDTH, Math.max(...needed)));
}

export interface ClusterBoxOptions {
  title: string;
  items: ClusterItem[];
  /** Colors for the item pill (e.g. "via egress") — a cross-reference or
   * independent-semantic color, not a layer accent, so it's supplied by
   * the caller rather than hardcoded (matches the schema's pill semantic
   * taxonomy: layer / viaEgress / warning / etc.). */
  pillFg: string;
  pillBg: string;
  /** Colors for the mandatory "ACRONYM NEEDED" flag — defaults to the
   * fixed "warning" semantic tone (amber), same as the rest of the
   * project's warning/gap pills, independent of whatever pillFg/pillBg
   * this diagram's "via egress"-equivalent pill happens to use. */
  acronymFg?: string;
  acronymBg?: string;
}

export interface BoxResult {
  height: number;
  nodes: SvgNode[];
}

/**
 * External Systems cluster: rounded box (soft-gray border), bold header,
 * then dot+title(+pill)+description items separated by thin divider
 * lines. Box and per-item height are both computed from actual content
 * (including wrapped line count) — never a fixed number content is hoped
 * to fit into. Direct port of the prototype's `cluster_box`.
 */
export function clusterBox(x: number, y: number, w: number, opts: ClusterBoxOptions): BoxResult {
  const { title, items, pillFg, pillBg, acronymFg = AMBER, acronymBg = AMBER_PILL_BG } = opts;
  const pad = 16;
  const headerH = 44;
  const bottomPad = 20;
  const availW = w - pad - 16 - pad;

  const layouts = items.map((item) => itemLayout(item, availW));
  const h = headerH + layouts.reduce((sum, l) => sum + itemHeight(l), 0) + bottomPad;

  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: "#FFFFFF", stroke: SOFT_DIVIDER, sw: 1.5, rx: 10 }));
  nodes.push(text(x + pad, y + 26, title, { size: 13.5, weight: 700, fill: TITLE_C }));

  let iy = y + headerH + 8;
  items.forEach((item, i) => {
    const layout = layouts[i]!;
    if (i > 0) {
      const dy = iy - 24;
      nodes.push(line(x + pad, dy, x + w - pad, dy, SOFT_DIVIDER, 1.3));
    }
    nodes.push(dot(x + pad + 4, iy - 4, item.color));

    let ty = iy;
    for (const ln of layout.lines) {
      nodes.push(text(x + pad + 16, ty, ln, { size: 12.3, weight: 700, fill: TITLE_C }));
      ty += TITLE_LINE_H;
    }

    if (layout.pillMode === "inline" && item.pill) {
      const inlineX = x + pad + 16 + measureText(layout.lines[0]!, 12.3, 700) + TITLE_PILL_GAP;
      const { nodes: pillNodes } = pill(inlineX, iy - 14, item.pill, pillFg, pillBg);
      nodes.push(...pillNodes);
    } else if (layout.pillMode === "below" && item.pill) {
      const { nodes: pillNodes } = pill(x + pad + 16, ty - 13, item.pill, pillFg, pillBg);
      nodes.push(...pillNodes);
      ty += PILL_ROW_H;
    }

    if (layout.needsAcronym) {
      const { nodes: acronymNodes } = pill(x + pad + 16, ty - 13, "ACRONYM NEEDED", acronymFg, acronymBg);
      nodes.push(...acronymNodes);
      ty += PILL_ROW_H;
    }

    nodes.push(text(x + pad + 16, ty, item.sub, { size: 11, weight: 400, fill: MUTED_C }));
    iy += itemHeight(layout);
  });

  return { height: h, nodes };
}
