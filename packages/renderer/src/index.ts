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
export { itemBox, itemBoxNaturalHeight } from "./boxes/itemBox.js";
export type { ItemBoxOptions, ItemBoxPill } from "./boxes/itemBox.js";
export { gapNoteBox } from "./boxes/gapNoteBox.js";
export type { GapNoteBoxOptions } from "./boxes/gapNoteBox.js";

export * as constants from "./constants.js";

export {
  getColorFamily,
  resolveLayerToken,
  resolveNeutralToken,
  resolveSemanticPill,
  resolvePillColors,
  layerAccentPillColors,
  getSubLayerRegistryEntries,
  getSubLayerRegistryEntry,
} from "./registryColors.js";
export type { LayerToken, SemanticPillToken, SubLayerRegistryEntry } from "./registryColors.js";

export type {
  PillIR,
  ItemIR,
  GatewayIR,
  SubLayerInstanceIR,
  SystemsOfRecordSectionIR,
  ClusterIR,
  GapNoteIR,
  LegendEntryIR,
  AbbreviationIR,
  DiagramIR,
} from "./ir.js";

export { resolveDotColor, resolveItemPill } from "./layout/resolveItem.js";
export { renderRow } from "./layout/row.js";
export { renderSubLayer } from "./layout/subLayer.js";
export { renderCorePlatform } from "./layout/corePlatform.js";
export { renderInboundActors } from "./layout/inboundActors.js";
export { renderExternalSystems, computeExternalSystemsWidth } from "./layout/externalSystems.js";
export { renderIngressEgress } from "./layout/ingressEgress.js";
export { renderLegend } from "./layout/legend.js";
export { renderNotes } from "./layout/notes.js";

export { render } from "./render.js";
export type { RenderOptions } from "./render.js";
