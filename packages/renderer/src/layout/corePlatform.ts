import type { SvgNode } from "../svg/node.js";
import type { DiagramIR } from "../ir.js";
import { rect, text } from "../svg/primitives.js";
import { gapNoteBox } from "../boxes/gapNoteBox.js";
import { layerFrame } from "../boxes/layerFrame.js";
import { renderSubLayer } from "./subLayer.js";
import { renderRow } from "./row.js";
import {
  getSubLayerRegistryEntries,
  resolveLayerToken,
  resolveSemanticPill,
  layerAccentPillColors,
} from "../registryColors.js";
import { MUTED_C, NAVY_BORDER, NAVY_BG } from "../constants.js";

const WRAPPER_INSET = 18;
const WRAPPER_INNER_PAD = 16;
const WRAPPER_HEADER_H = 44;
const WRAPPER_BOTTOM_PAD = 14;
const SUB_LAYER_STACK_GAP = 16;
const SOR_GAP_BELOW_WRAPPER = 20;
const MISSING_LAYER_TAG = "GAP — NOT IMPLEMENTED";

export interface CorePlatformResult {
  height: number;
  nodes: SvgNode[];
}

/**
 * Renders the whole Core Platform column: outer dashed frame, the
 * "deployed in" wrapper containing sub-layers stacked in the registry's
 * governed order (rendering a real sub-layer if the IR has one, an honest
 * dashed gap note if the registry expects one but the IR has none and
 * flags why, or skipping entirely if neither — see the schema-governance
 * decision that a missing layer must never be silently invented), then
 * Systems of Record as a sibling section below the wrapper (not nested
 * inside it — the documented majority pattern from the reference
 * templates). Every height is computed from actual content.
 */
export function renderCorePlatform(ir: DiagramIR, x: number, frameY: number, w: number, frameHeight?: number): CorePlatformResult {
  const family = ir.colorTheme.family ?? "standard";
  const core = ir.columns.corePlatform;

  const depX = x + WRAPPER_INSET;
  const depW = w - WRAPPER_INSET * 2;
  const depY = frameY + 16;
  const innerX = depX + WRAPPER_INNER_PAD;
  const innerW = depW - WRAPPER_INNER_PAD * 2;

  const registryEntries = getSubLayerRegistryEntries().filter((e) => e.id !== "systems-of-record");
  const missingLayerNotes = (ir.unclassified ?? []).filter((g) => g.reason === "missing-layer");

  let y = WRAPPER_HEADER_H;
  const subLayerNodes: SvgNode[] = [];
  for (const entry of registryEntries) {
    const instance = core.subLayers.find((s) => s.registryId === entry.id);
    if (instance) {
      const { height, nodes } = renderSubLayer(instance, innerX, depY + y, innerW, family);
      subLayerNodes.push(...nodes);
      y += height + SUB_LAYER_STACK_GAP;
      continue;
    }
    const gapNote = missingLayerNotes.find((g) => g.location === entry.id);
    if (gapNote) {
      const accent = resolveLayerToken(family, entry.accentColorToken);
      const warning = resolveSemanticPill(family, "warning");
      const notePad = 16;
      const noteX = innerX + notePad;
      const noteW = innerW - notePad * 2;
      const { height: noteH, nodes: noteNodes } = gapNoteBox(noteX, depY + y + 36, noteW, {
        title: gapNote.title,
        description: gapNote.description,
      });
      const frameH = 36 + noteH + 14;
      const frameNodes = layerFrame(innerX, depY + y, innerW, frameH, {
        label: entry.label,
        border: accent.border,
        bg: accent.background,
        tag: MISSING_LAYER_TAG,
        tagFg: warning.fg,
        tagBg: warning.bg,
      });
      subLayerNodes.push(...frameNodes, ...noteNodes);
      y += frameH + SUB_LAYER_STACK_GAP;
    }
    // else: registry expects this layer, IR has neither an instance nor a
    // documented gap for it — skip silently rather than invent one. (This
    // is a looser stance than a hard validation error; revisit once real
    // usage shows whether that's too permissive.)
  }

  // Undo the trailing SUB_LAYER_STACK_GAP added after the last sub-layer
  // (there's no next one to space out from), then add real bottom padding
  // — without it, the last sub-layer's own bottom border and the wrapper's
  // bottom border land on the exact same y-coordinate and visibly overlap.
  const wrapperH = y - SUB_LAYER_STACK_GAP + WRAPPER_BOTTOM_PAD;

  const wrapperNodes: SvgNode[] = [
    rect(depX, depY, depW, wrapperH, { fill: NAVY_BG, stroke: NAVY_BORDER, sw: 2, rx: 10 }),
    text(depX + depW / 2, depY + 28, `DEPLOYED IN ${core.deployedIn.toUpperCase()}`, {
      size: 13,
      weight: 700,
      fill: NAVY_BORDER,
      anchor: "middle",
    }),
  ];

  // --- Systems of Record: sibling section below the wrapper, still inside
  // the outer dashed Core Platform frame. ---
  const sorEntry = getSubLayerRegistryEntries().find((e) => e.id === "systems-of-record")!;
  const sorAccent = resolveLayerToken(family, sorEntry.accentColorToken);
  const sorY = depY + wrapperH + SOR_GAP_BELOW_WRAPPER;
  const sorInnerPad = 16;
  const sorRowY = 42;
  const { height: sorRowH, nodes: sorRowNodes } = renderRow(
    core.systemsOfRecord.items,
    x + sorInnerPad,
    sorY + sorRowY,
    w - sorInnerPad * 2,
    family,
    sorAccent
  );
  const sorH = sorRowY + sorRowH + 14;
  const sorTagLabel = core.systemsOfRecord.tagOverride ?? sorEntry.defaultTag?.label ?? null;
  const sorTagColors = core.systemsOfRecord.tagOverride
    ? resolveSemanticPill(family, "warning")
    : sorEntry.defaultTag
      ? layerAccentPillColors(sorAccent)
      : null;
  const sorFrameNodes = layerFrame(x, sorY, w, sorH, {
    label: sorEntry.label,
    border: sorAccent.border,
    bg: sorAccent.background,
    tag: sorTagLabel,
    tagFg: sorTagColors?.fg ?? null,
    tagBg: sorTagColors?.bg ?? null,
  });

  const naturalHeight = sorY + sorH - frameY;

  const outerH = frameHeight ?? naturalHeight;
  const outerFrame = rect(x, frameY, w, outerH, { fill: "#FFFFFF", stroke: MUTED_C, sw: 1.6, rx: 10, dash: "6 5" });

  return {
    height: naturalHeight,
    nodes: [outerFrame, ...wrapperNodes, ...subLayerNodes, ...sorFrameNodes, ...sorRowNodes],
  };
}
