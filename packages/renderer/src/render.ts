import type { DiagramIR } from "./ir.js";
import { validate } from "./validate.js";
import { rect, text } from "./svg/primitives.js";
import { serializeNodes, type SvgNode } from "./svg/node.js";
import { embedFontsInSvg } from "./svg/embedFonts.js";
import { colHeader } from "./boxes/labels.js";
import { renderInboundActors } from "./layout/inboundActors.js";
import { renderCorePlatform } from "./layout/corePlatform.js";
import { renderExternalSystems, computeExternalSystemsWidth } from "./layout/externalSystems.js";
import { renderIngressEgress } from "./layout/ingressEgress.js";
import { renderLegend } from "./layout/legend.js";
import { renderNotes } from "./layout/notes.js";
import { MUTED_C, TITLE_C } from "./constants.js";

const MARGIN = 30;
const GAP = 28;
const TITLE_Y = 44;
const SUBTITLE_Y = 66;
const HEAD_Y = 92;
const FRAME_Y = 118;
const MIN_FRAME_H = 300;
const FOOTER_GAP = 24;

// Fixed floor widths, matching the validated prototype's own values — these
// column types already wrap/stack their content robustly, so unlike
// External Systems (see computeExternalSystemsWidth), dynamic width isn't
// needed for correctness here, only for visual rhythm.
const INBOUND_W = 260;
const INGRESS_W = 150;
const CORE_W = 900;
const EGRESS_W = 150;

export interface RenderOptions {
  /** Skips validate() before rendering. Off by default — rendering an IR
   * that fails schema/registry checks would otherwise silently produce
   * broken geometry (e.g. a missing registryId throwing deep inside a
   * layout function) instead of one clear, upfront error. */
  skipValidate?: boolean;
  /** Embeds the bundled Arimo font (the same one text is measured against)
   * into the output SVG as a base64 @font-face. On by default — this is
   * the actual fix for the measure-vs-render font mismatch that motivated
   * this project's TypeScript rewrite; opt out only if a caller has its
   * own font pipeline or genuinely needs a smaller file. */
  embedFonts?: boolean;
}

/**
 * Renders a DiagramIR to a complete SVG document string. Follows the
 * "measure pass (bottom-up) then arrange pass (top-down)" pattern decided
 * for this generalized renderer: the three variable-height columns
 * (Inbound Actors, Core Platform, External Systems) are each rendered once
 * to learn their natural content height, FRAME_H is taken as the max of
 * those (so every column's outer frame reaches the same depth, matching
 * the reference templates), then all five columns are rendered again with
 * that shared FRAME_H. Nodes are plain data, so paint order is just array
 * order — frames are listed before the content stacked on top of them.
 */
export function render(ir: DiagramIR, opts: RenderOptions = {}): string {
  if (!opts.skipValidate) {
    const result = validate(ir);
    if (!result.valid) {
      throw new Error(`Invalid diagram IR:\n${result.errors.join("\n")}`);
    }
  }

  const family = ir.colorTheme.family ?? "standard";
  const externalW = computeExternalSystemsWidth(ir, family);

  let cx = MARGIN;
  const inboundX = cx;
  cx += INBOUND_W + GAP;
  const ingressX = cx;
  cx += INGRESS_W + GAP;
  const coreX = cx;
  cx += CORE_W + GAP;
  const egressX = cx;
  cx += EGRESS_W + GAP;
  const externalX = cx;
  cx += externalW;
  const canvasW = cx + MARGIN;

  const inboundNatural = renderInboundActors(ir, inboundX, FRAME_Y, INBOUND_W, family);
  const coreNatural = renderCorePlatform(ir, coreX, FRAME_Y, CORE_W);
  const externalNatural = renderExternalSystems(ir, externalX, FRAME_Y, externalW, family);
  const frameH = Math.max(inboundNatural.height, coreNatural.height, externalNatural.height, MIN_FRAME_H);

  const inbound = renderInboundActors(ir, inboundX, FRAME_Y, INBOUND_W, family, frameH);
  const core = renderCorePlatform(ir, coreX, FRAME_Y, CORE_W, frameH);
  const external = renderExternalSystems(ir, externalX, FRAME_Y, externalW, family, frameH);
  const ingressNodes = renderIngressEgress(ir.columns.ingress.gateway, ingressX, FRAME_Y, INGRESS_W, frameH);
  const egressNodes = renderIngressEgress(ir.columns.egress.gateway, egressX, FRAME_Y, EGRESS_W, frameH);

  const footerY = FRAME_Y + frameH + FOOTER_GAP;
  const legendW = INBOUND_W + GAP + INGRESS_W + GAP + 420;
  const legend = renderLegend(ir, inboundX, footerY, legendW, family);

  const notesLines = ir.notes ?? [];
  let notes: { height: number; nodes: SvgNode[] } | null = null;
  if (notesLines.length > 0) {
    const notesX = coreX + CORE_W - 470;
    const notesW = externalX + externalW - notesX;
    notes = renderNotes(notesLines, notesX, footerY, notesW);
  }

  const footerH = Math.max(legend.height, notes?.height ?? 0);
  const canvasH = footerY + footerH + MARGIN;

  const titleNodes: SvgNode[] = [
    text(canvasW / 2, TITLE_Y, ir.title, { size: 24, weight: 700, fill: TITLE_C, anchor: "middle" }),
  ];
  if (ir.subtitle) {
    titleNodes.push(text(canvasW / 2, SUBTITLE_Y, ir.subtitle, { size: 13.5, weight: 400, fill: MUTED_C, anchor: "middle" }));
  }

  const headerNodes: SvgNode[] = [
    ...colHeader(inboundX + INBOUND_W / 2, HEAD_Y, "Inbound Actors", "(Requesters)"),
    ...colHeader(ingressX + INGRESS_W / 2, HEAD_Y, "Ingress"),
    ...colHeader(coreX + CORE_W / 2, HEAD_Y, "Core Platform"),
    ...colHeader(egressX + EGRESS_W / 2, HEAD_Y, "Egress"),
    ...colHeader(externalX + externalW / 2, HEAD_Y, "External Systems"),
  ];

  const background = rect(0, 0, canvasW, canvasH, { fill: "#FFFFFF", stroke: null, rx: 0 });

  const allNodes: SvgNode[] = [
    background,
    ...titleNodes,
    ...headerNodes,
    ...inbound.nodes,
    ...ingressNodes,
    ...core.nodes,
    ...egressNodes,
    ...external.nodes,
    ...legend.nodes,
    ...(notes?.nodes ?? []),
  ];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">\n${serializeNodes(allNodes)}\n</svg>`;
  return opts.embedFonts ?? true ? embedFontsInSvg(svg) : svg;
}
