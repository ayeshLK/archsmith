import type { SvgNode } from "../svg/node.js";
import { rect, circle, line, text } from "../svg/primitives.js";
import { MINT_BORDER, MINT_ICON_INNER, MUTED_C, TITLE_C } from "../constants.js";

export interface GatewayBoxOptions {
  label: string;
  sub: string;
  border?: string;
  inner?: string;
}

/**
 * API Gateway icon box (Ingress/Egress). Direct port of the prototype's
 * `gateway_box()`. The icon is a double concentric circle — outer ring in
 * the box's own border color, plus a smaller inner circle containing the
 * "+", in a visibly darker shade — not a single flat circle, which is what
 * an earlier draft drew before pixel-measuring the reference templates.
 */
export function gatewayBox(x: number, y: number, w: number, h: number, opts: GatewayBoxOptions): SvgNode[] {
  const { label, sub, border = MINT_BORDER, inner = MINT_ICON_INNER } = opts;
  const nodes: SvgNode[] = [];
  nodes.push(rect(x, y, w, h, { fill: "#FFFFFF", stroke: border, sw: 1.6, rx: 10 }));

  const ccx = x + w / 2;
  const ccy = y + 26;
  const r = 13;
  const innerR = 6;
  nodes.push(circle(ccx, ccy, r, { stroke: border, sw: 1.8 }));
  nodes.push(circle(ccx, ccy, innerR, { stroke: inner, sw: 1.5 }));
  nodes.push(line(ccx - 3, ccy, ccx + 3, ccy, inner, 1.5));
  nodes.push(line(ccx, ccy - 3, ccx, ccy + 3, inner, 1.5));

  nodes.push(text(ccx, y + 56, label, { size: 13, weight: 700, fill: TITLE_C, anchor: "middle" }));
  nodes.push(text(ccx, y + 73, sub, { size: 11, weight: 400, fill: MUTED_C, anchor: "middle" }));
  return nodes;
}
