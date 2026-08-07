import type { SvgNode } from "./node.js";
import { measureText } from "../text/measure.js";
import { BODY_C, FONT, INK } from "../constants.js";

export interface TextOptions {
  size?: number;
  weight?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  italic?: boolean;
}

/** Direct port of the prototype's `text()`. */
export function text(x: number, y: number, s: string, opts: TextOptions = {}): SvgNode {
  const { size = 12, weight = 400, fill = BODY_C, anchor = "start", italic = false } = opts;
  const attrs: Record<string, string | number> = {
    x,
    y,
    "font-family": FONT,
    "font-size": size,
    "font-weight": weight,
    fill,
    "text-anchor": anchor,
  };
  if (italic) attrs["font-style"] = "italic";
  return { tag: "text", attrs, text: s };
}

export interface RectOptions {
  fill?: string;
  /** null omits the stroke attributes entirely — matches the prototype's
   * `stroke=None` convention (e.g. a pill's rect has no border). */
  stroke?: string | null;
  sw?: number;
  rx?: number;
  dash?: string | null;
}

/** Direct port of the prototype's `rect()`. Always rx=ry (rounded rect) —
 * per the project's own hard-won pitfall, never use SVG clip-path for box
 * shapes, it silently drops rounded corners. */
export function rect(x: number, y: number, w: number, h: number, opts: RectOptions = {}): SvgNode {
  const { fill = "#FFFFFF", stroke = INK, sw = 1.5, rx = 10, dash = null } = opts;
  const attrs: Record<string, string | number> = { x, y, width: w, height: h, rx, ry: rx, fill };
  if (stroke) {
    attrs.stroke = stroke;
    attrs["stroke-width"] = sw;
  }
  if (dash) {
    attrs["stroke-dasharray"] = dash;
  }
  return { tag: "rect", attrs };
}

export interface CircleOptions {
  fill?: string;
  stroke?: string;
  sw?: number;
}

export function circle(cx: number, cy: number, r: number, opts: CircleOptions = {}): SvgNode {
  const { fill = "none", stroke, sw = 1 } = opts;
  const attrs: Record<string, string | number> = { cx, cy, r, fill };
  if (stroke) {
    attrs.stroke = stroke;
    attrs["stroke-width"] = sw;
  }
  return { tag: "circle", attrs };
}

export function line(x1: number, y1: number, x2: number, y2: number, stroke: string, sw: number, dash?: string): SvgNode {
  const attrs: Record<string, string | number> = { x1, y1, x2, y2, stroke, "stroke-width": sw };
  if (dash) attrs["stroke-dasharray"] = dash;
  return { tag: "line", attrs };
}

/** Direct port of the prototype's `dot()` — a filled circle, no stroke. */
export function dot(x: number, y: number, color: string, r: number = 4.5): SvgNode {
  return { tag: "circle", attrs: { cx: x, cy: y, r, fill: color } };
}

/** Direct port of the prototype's `pill_width()`. */
export function pillWidth(label: string): number {
  return 20 + measureText(label, 10, 700);
}

export interface Pill {
  nodes: SvgNode[];
  width: number;
}

/** Direct port of the prototype's `pill()`. Python's version returned only
 * the width (since it pushed its nodes directly into the shared `parts`
 * list); this returns both, since there's no shared list to push into. */
export function pill(x: number, y: number, label: string, fg: string, bg: string): Pill {
  const w = pillWidth(label);
  const h = 20;
  const nodes: SvgNode[] = [
    rect(x, y, w, h, { fill: bg, stroke: null, rx: 10 }),
    text(x + w / 2, y + 14, label, { size: 10, weight: 700, fill: fg, anchor: "middle" }),
  ];
  return { nodes, width: w };
}
