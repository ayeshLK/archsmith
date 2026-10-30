import { getRegistry } from "@archsmith/schema";
import type { SvgNode } from "../svg/node.js";

type IconShape =
  | { type: "circle"; cx: number; cy: number; r: number }
  | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "polyline"; points: [number, number][]; closed?: boolean }
  | { type: "rect"; x: number; y: number; width: number; height: number; rx: number };

interface IconEntry {
  shapes: IconShape[];
}

interface IconRegistry {
  visualContract: { viewBox: string; strokeWidth: number; strokeLineCap: string; strokeLineJoin: string };
  icons: Record<string, IconEntry>;
}

const ALLOWED_PRIMITIVES = new Set(["circle", "ellipse", "line", "polyline", "rect"]);
export const ITEM_ICON_SIZE = 16;
export const ITEM_ICON_GAP = 4;

/**
 * Render one governed icon from numeric, allow-listed geometry. The registry
 * cannot supply SVG markup, path data, arbitrary attributes, or color; this
 * function owns the element tags and outline styling.
 */
export function itemIconNodes(token: string, x: number, y: number, size: number, color: string): SvgNode[] {
  const registry = getRegistry("icons") as IconRegistry;
  const entry = registry.icons[token];
  if (!entry) throw new Error(`Unknown item icon token "${token}" — see registries/icons.json`);
  const nodes: SvgNode[] = [];
  for (const shape of entry.shapes) {
    if (!ALLOWED_PRIMITIVES.has(shape.type)) {
      throw new Error(`Unsupported primitive in item icon token "${token}"`);
    }
    const scale = size / 24;
    const coord = (n: number): number => x + n * scale;
    const yCoord = (n: number): number => y + n * scale;
    const strokeAttrs = {
      fill: "none",
      stroke: color,
      "stroke-width": registry.visualContract.strokeWidth * scale,
      "stroke-linecap": registry.visualContract.strokeLineCap,
      "stroke-linejoin": registry.visualContract.strokeLineJoin,
    };
    switch (shape.type) {
      case "circle":
        nodes.push({ tag: "circle", attrs: { ...strokeAttrs, cx: coord(shape.cx), cy: yCoord(shape.cy), r: shape.r * scale } });
        break;
      case "ellipse":
        nodes.push({ tag: "ellipse", attrs: { ...strokeAttrs, cx: coord(shape.cx), cy: yCoord(shape.cy), rx: shape.rx * scale, ry: shape.ry * scale } });
        break;
      case "line":
        nodes.push({ tag: "line", attrs: { ...strokeAttrs, x1: coord(shape.x1), y1: yCoord(shape.y1), x2: coord(shape.x2), y2: yCoord(shape.y2) } });
        break;
      case "polyline": {
        const points = shape.closed ? [...shape.points, shape.points[0]!] : shape.points;
        nodes.push({
          tag: "polyline",
          attrs: { ...strokeAttrs, points: points.map(([px, py]) => `${coord(px)},${yCoord(py)}`).join(" ") },
        });
        break;
      }
      case "rect":
        nodes.push({
          tag: "rect",
          attrs: {
            ...strokeAttrs,
            x: coord(shape.x),
            y: yCoord(shape.y),
            width: shape.width * scale,
            height: shape.height * scale,
            rx: shape.rx * scale,
            ry: shape.rx * scale,
          },
        });
        break;
    }
  }
  return nodes;
}
