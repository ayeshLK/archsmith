import type { SvgNode } from "../svg/node.js";
import type { ClusterIR, DiagramIR, ItemIR } from "../ir.js";
import { rect } from "../svg/primitives.js";
import { clusterBox, clusterContentWidth, type ClusterItem } from "../boxes/clusterBox.js";
import { resolveDotColor } from "./resolveItem.js";
import { resolveSemanticPill } from "../registryColors.js";
import { SOFT_DIVIDER } from "../constants.js";

const OUTER_FRAME_INSET = 12;
const CLUSTER_GAP = 20;

function toClusterItems(items: ItemIR[], family: string): ClusterItem[] {
  return items.map((item) => ({
    color: resolveDotColor(item, family),
    title: item.title,
    sub: (item.descriptionLines ?? []).join(" "),
    pill: item.pill?.label ?? null,
    acronym: item.acronym ?? null,
  }));
}

/**
 * Content-driven width for the whole External Systems column: the widest
 * single cluster's own required width (each cluster is its own full-width
 * box, stacked vertically, so the column must fit the widest one) — the
 * one column width that isn't a fixed floor constant, per the schema's own
 * intent that clusters are named, arbitrarily-sized groupings.
 */
export function computeExternalSystemsWidth(ir: DiagramIR, family: string): number {
  const clusters = ir.columns.externalSystems.clusters;
  const widths = clusters.map((c) => clusterContentWidth(c.name, toClusterItems(c.items, family)));
  return Math.max(...widths, 260) + OUTER_FRAME_INSET * 2;
}

export interface ExternalSystemsResult {
  height: number;
  nodes: SvgNode[];
  needsAcronym: string[];
}

/**
 * External Systems column: a soft-gray outer frame around stacked named
 * clusters (each its own clusterBox — soft rounded border, bold header,
 * dot+title+pill+description items with thin dividers between them).
 * "via egress" is the only pill semantic the reference templates ever show
 * here, and clusterBox takes one fg/bg per box (a real, inherited
 * limitation of the ported primitive — not introduced here), so the whole
 * column resolves that one semantic once rather than per item.
 */
export function renderExternalSystems(ir: DiagramIR, x: number, frameY: number, w: number, family: string, frameHeight?: number): ExternalSystemsResult {
  const innerX = x + OUTER_FRAME_INSET;
  const innerW = w - OUTER_FRAME_INSET * 2;
  const viaEgress = resolveSemanticPill(family, "viaEgress");

  const nodes: SvgNode[] = [];
  const needsAcronym: string[] = [];
  let cy = frameY + OUTER_FRAME_INSET;
  for (const cluster of ir.columns.externalSystems.clusters as ClusterIR[]) {
    const { height, nodes: clusterNodes, needsAcronym: clusterAcronym } = clusterBox(innerX, cy, innerW, {
      title: cluster.name,
      items: toClusterItems(cluster.items, family),
      pillFg: viaEgress.fg,
      pillBg: viaEgress.bg,
    });
    nodes.push(...clusterNodes);
    needsAcronym.push(...clusterAcronym);
    cy += height + CLUSTER_GAP;
  }
  const naturalHeight = cy - CLUSTER_GAP + OUTER_FRAME_INSET - frameY;

  const outerH = frameHeight ?? naturalHeight;
  const outerFrame = rect(x, frameY, w, outerH, { fill: "#FFFFFF", stroke: SOFT_DIVIDER, sw: 1.4, rx: 10 });

  return { height: naturalHeight, nodes: [outerFrame, ...nodes], needsAcronym };
}
