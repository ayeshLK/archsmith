import type { SvgNode } from "../svg/node.js";
import type { GatewayIR } from "../ir.js";
import { rect } from "../svg/primitives.js";
import { gatewayBox } from "../boxes/gatewayBox.js";
import { MINT_BG, MINT_BORDER } from "../constants.js";

const GATEWAY_INSET = 12;
const GATEWAY_BOX_H = 100;

/**
 * Ingress/Egress lane: a solid mint-tinted full-height frame with one
 * white API Gateway box, vertically centered within `frameHeight` — the
 * one column whose content position genuinely depends on the shared
 * FRAME_H the other columns only use to size a decorative outer frame.
 * Pixel-measured in two reference templates: the gateway box's own
 * vertical center matches the lane's vertical center almost exactly (610
 * vs 610 in sample-1; 694 vs 695.5 in sample-2), so this centers rather
 * than pins the box near the top.
 */
export function renderIngressEgress(gateway: GatewayIR, x: number, frameY: number, w: number, frameHeight: number): SvgNode[] {
  const laneFrame = rect(x, frameY, w, frameHeight, { fill: MINT_BG, stroke: MINT_BORDER, sw: 1.6, rx: 10 });
  const gatewayY = frameY + (frameHeight - GATEWAY_BOX_H) / 2;
  const gatewayNodes = gatewayBox(x + GATEWAY_INSET, gatewayY, w - GATEWAY_INSET * 2, GATEWAY_BOX_H, {
    label: gateway.label,
    sub: gateway.sublabel ?? "",
  });
  return [laneFrame, ...gatewayNodes];
}
