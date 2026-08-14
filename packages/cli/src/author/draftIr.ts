import type {
  ItemIR,
  GatewayIR,
  SubLayerInstanceIR,
  SystemsOfRecordSectionIR,
  ClusterIR,
  GapNoteIR,
  LegendEntryIR,
  AbbreviationIR,
} from "@archsmith/renderer";

/**
 * A DiagramIR in progress — every field the real DiagramIR requires may
 * still be missing while an `archsmith author` session is underway.
 * Hand-written, deliberately not derived via a generic DeepPartial<T>
 * utility: ir.ts itself is a hand-written parallel to diagram-schema.json
 * rather than code-generated (see its own header comment), and this is
 * that same convention one layer up, for the in-progress shape rather than
 * the final one. Each FieldDescriptor's read()/write() operates directly
 * on this shape — there is no separate flat draft representation to keep
 * in sync with it.
 */
export interface DraftIR {
  "$schema"?: string;
  schemaVersion?: string;
  title?: string;
  subtitle?: string;
  colorTheme?: { family: "standard" };
  columns?: {
    inboundActors?: { items?: ItemIR[] };
    ingress?: { gateway?: GatewayIR };
    corePlatform?: {
      deployedOn?: string;
      subLayers?: SubLayerInstanceIR[];
      systemsOfRecord?: SystemsOfRecordSectionIR;
    };
    egress?: { gateway?: GatewayIR };
    externalSystems?: { clusters?: ClusterIR[] };
  };
  legend?: {
    entries?: LegendEntryIR[];
    abbreviations?: AbbreviationIR[];
  };
  notes?: string[] | null;
  unclassified?: GapNoteIR[];
}
