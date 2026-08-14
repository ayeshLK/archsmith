import type { SvgNode } from "../svg/node.js";
import type { SubLayerInstanceIR } from "../ir.js";
import { layerFrame } from "../boxes/layerFrame.js";
import { renderRow } from "./row.js";
import {
  getSubLayerRegistryEntry,
  resolveLayerToken,
  resolveSemanticPill,
  layerAccentPillColors,
} from "../registryColors.js";

const ROW_TOP_GAP = 36; // gap from the layer frame's top edge to its first row of boxes
const ROW_STACK_GAP = 16; // gap between consecutive rows within one sub-layer
const BOTTOM_PAD = 14;
const INNER_PAD = 16; // left/right inset of the row content from the layer frame's edges

export interface SubLayerResult {
  height: number;
  nodes: SvgNode[];
  needsAcronym: string[];
}

/**
 * Renders one Core Platform sub-layer instance: its layerFrame (accent
 * color + label + tag, resolved from the governed sub-layers/colors
 * registries — never hardcoded, so a diagram can legitimately remap accent
 * colors per sample-3's precedent) plus its stacked rows of items. Height
 * is computed from the actual rows, never a fixed number — the direct
 * generalization the prototype's own hand-tuned disc_h/exec_h/ent_h
 * constants never had to be.
 */
export function renderSubLayer(instance: SubLayerInstanceIR, x: number, y: number, w: number, family: string): SubLayerResult {
  const registryEntry = getSubLayerRegistryEntry(instance.registryId);
  const layerToken = resolveLayerToken(family, registryEntry.accentColorToken);

  // A tagOverride is specifically for signaling an exception (e.g. "GAP —
  // NOT IMPLEMENTED" on an Entity Layer that doesn't exist) per the
  // schema's own field description — so it uses the fixed "warning"
  // semantic, independent of this layer's own accent, not the layer's own
  // tag color. The registry's own defaultTag (when no override) inherits
  // the layer's accent, as an ordinary descriptive label should.
  const tagLabel = instance.tagOverride ?? registryEntry.defaultTag?.label ?? null;
  const tagColors = instance.tagOverride
    ? resolveSemanticPill(family, "warning")
    : registryEntry.defaultTag
      ? layerAccentPillColors(layerToken)
      : null;

  const innerX = x + INNER_PAD;
  const innerW = w - INNER_PAD * 2;

  let rowY = ROW_TOP_GAP;
  const rowNodes: SvgNode[] = [];
  const needsAcronym: string[] = [];
  for (const row of instance.rows) {
    const { height: rowH, nodes, needsAcronym: rowAcronym } = renderRow(row, innerX, y + rowY, innerW, family, layerToken);
    rowNodes.push(...nodes);
    needsAcronym.push(...rowAcronym);
    rowY += rowH + ROW_STACK_GAP;
  }
  const contentBottom = rowY - ROW_STACK_GAP; // undo the trailing gap after the last row
  const height = contentBottom + BOTTOM_PAD;

  const frameNodes = layerFrame(x, y, w, height, {
    label: registryEntry.label,
    border: layerToken.border,
    bg: layerToken.background,
    tag: tagLabel,
    tagFg: tagColors?.fg ?? null,
    tagBg: tagColors?.bg ?? null,
  });

  return { height, nodes: [...frameNodes, ...rowNodes], needsAcronym };
}
