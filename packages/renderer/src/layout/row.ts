import type { SvgNode } from "../svg/node.js";
import type { ItemIR } from "../ir.js";
import { itemBox, itemBoxNaturalHeight } from "../boxes/itemBox.js";
import { resolveItemPill } from "./resolveItem.js";
import type { LayerToken } from "../registryColors.js";

const ROW_GAP = 20; // matches the prototype's consistent gap between side-by-side boxes

export interface RowResult {
  height: number;
  nodes: SvgNode[];
}

/**
 * Renders one row of items side by side, each box's own eyebrow/dotColor
 * ignored (Core Platform items never showed a dot in any reference
 * template — only Inbound Actors and External Systems items do) but
 * sharing a uniform height: the row's tallest natural content, per this
 * project's own established pitfall ("boxes in the same row should share
 * a uniform height, not each be sized to its own"). Width is also uniform,
 * dividing the available width evenly with ROW_GAP between boxes.
 */
export function renderRow(items: ItemIR[], x: number, y: number, w: number, family: string, layerAccent?: LayerToken): RowResult {
  const n = items.length;
  const boxW = (w - ROW_GAP * (n - 1)) / n;

  const itemOpts = items.map((item) => ({
    eyebrow: item.eyebrow ?? null,
    title: item.title,
    descriptionLines: item.descriptionLines ?? [],
    pill: resolveItemPill(item.pill, family, layerAccent),
    acronym: item.acronym ?? null,
  }));

  const rowHeight = Math.max(...itemOpts.map((opts) => itemBoxNaturalHeight(boxW, opts)));

  const nodes: SvgNode[] = [];
  itemOpts.forEach((opts, i) => {
    const boxX = x + i * (boxW + ROW_GAP);
    const { nodes: boxNodes } = itemBox(boxX, y, boxW, { ...opts, minHeight: rowHeight });
    nodes.push(...boxNodes);
  });

  return { height: rowHeight, nodes };
}
