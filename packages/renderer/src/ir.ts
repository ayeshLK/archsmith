// Hand-written TypeScript types mirroring @archsmith/schema's diagram-schema.json.
// Not code-generated (yet — see project plan's "packaging" phase for
// json-schema-to-typescript as a future build step); validate() via ajv is
// the actual structural authority, these types are for renderer-side
// developer ergonomics only.

export interface PillIR {
  label: string;
  semantic: "layer" | "viaEgress" | "primary" | "warning" | "highlight";
}

export interface ItemIR {
  eyebrow?: string | null;
  icon?: string | null;
  dotColor?: string | null;
  title: string;
  descriptionLines?: string[];
  pill?: PillIR | null;
  acronym?: string | null;
}

export interface GatewayIR {
  label: string;
  sublabel?: string | null;
}

export interface SubLayerInstanceIR {
  registryId: string;
  tagOverride?: string | null;
  rows: ItemIR[][];
}

export interface SystemsOfRecordSectionIR {
  registryId: string;
  tagOverride?: string | null;
  items: ItemIR[];
}

export interface ClusterIR {
  name: string;
  items: ItemIR[];
}

export interface GapNoteIR {
  title: string;
  description: string;
  reason: "missing-layer" | "unmapped-input";
  location?: string | null;
}

export interface LegendEntryIR {
  colorToken: string;
  label: string;
}

export interface AbbreviationIR {
  acronym: string;
  fullName: string;
}

export interface DiagramIR {
  "$schema"?: string;
  schemaVersion: string;
  title: string;
  subtitle: string;
  colorTheme: { family: "standard" };
  columns: {
    inboundActors: { items: ItemIR[] };
    ingress: { gateway: GatewayIR };
    corePlatform: {
      deployedOn: string;
      subLayers: SubLayerInstanceIR[];
      systemsOfRecord: SystemsOfRecordSectionIR;
    };
    egress: { gateway: GatewayIR };
    externalSystems: { clusters: ClusterIR[] };
  };
  legend?: {
    entries: LegendEntryIR[];
    abbreviations?: AbbreviationIR[];
  };
  notes?: string[] | null;
  unclassified?: GapNoteIR[];
}
