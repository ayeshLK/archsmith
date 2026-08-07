export { validate, validateStructure, validateRegistryReferences } from "./validate.js";
export type { ValidationResult } from "./validate.js";
export { measureText } from "./text/measure.js";
export { wrapText } from "./text/wrap.js";

export type { SvgNode } from "./svg/node.js";
export { serializeNode, serializeNodes, escapeXml } from "./svg/node.js";
export { text, rect, circle, line, dot, pill, pillWidth } from "./svg/primitives.js";
export type { TextOptions, RectOptions, CircleOptions, Pill } from "./svg/primitives.js";

export { labelTag, colHeader } from "./boxes/labels.js";
export { layerFrame } from "./boxes/layerFrame.js";
export type { LayerFrameOptions } from "./boxes/layerFrame.js";
export { actorBox } from "./boxes/actorBox.js";
export type { ActorBoxOptions, BoxResult } from "./boxes/actorBox.js";
export { gatewayBox } from "./boxes/gatewayBox.js";
export type { GatewayBoxOptions } from "./boxes/gatewayBox.js";
export { detailBox } from "./boxes/detailBox.js";
export type { DetailBoxOptions } from "./boxes/detailBox.js";
export { simpleBox } from "./boxes/simpleBox.js";
export type { SimpleBoxOptions } from "./boxes/simpleBox.js";
export { clusterBox, clusterContentWidth } from "./boxes/clusterBox.js";
export type { ClusterBoxOptions, ClusterItem } from "./boxes/clusterBox.js";

export * as constants from "./constants.js";

// render() is added in Phase 3 once the full layout-assembly module exists —
// intentionally not stubbed here to avoid a fake placeholder implementation.
