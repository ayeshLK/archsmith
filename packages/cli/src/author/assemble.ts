import { getDiagramSchema } from "@archsmith/schema";
import type { DiagramIR } from "@archsmith/renderer";
import type { DraftIR } from "./draftIr.js";
import { deriveLegendEntries, deriveAbbreviations, deriveColorFamily } from "./derived.js";

interface DiagramSchemaShape {
  properties: {
    schemaVersion: { const: string };
    "$schema": { const: string };
  };
}

/** Reads the live schema's own const values, rather than hardcoding a
 * version here that would silently drift the moment the schema bumps. */
function currentSchemaConsts(): { schemaVersion: string; schemaUrl: string } {
  const schema = getDiagramSchema() as DiagramSchemaShape;
  return { schemaVersion: schema.properties.schemaVersion.const, schemaUrl: schema.properties["$schema"].const };
}

/** Throws a specific, named error for a required scalar with no sensible
 * schema-valid default (title, subtitle, deployedOn, a gateway's own
 * label) — rather than silently writing an empty string that might slip
 * past validate() undetected if nothing enforces a minLength on it. */
function required(value: string | undefined, fieldPath: string): string {
  if (value === undefined || value === "") {
    throw new Error(`archsmith author: "${fieldPath}" hasn't been answered yet — assemble() needs every required scalar filled in first.`);
  }
  return value;
}

/**
 * Draft → complete DiagramIR. Deliberately does not duplicate validate()'s
 * own structural checks — inboundActors.items, corePlatform.subLayers,
 * systemsOfRecord.items, and externalSystems.clusters all have a real
 * minItems: 1 constraint (confirmed against the live schema, not assumed),
 * but this function passes them through as-is and lets validate() be the
 * single source of truth for whether there's enough content — no reason
 * to duplicate logic that already exists, is well-tested, and gives its
 * own clear message. The one thing this function does guard directly: a
 * required scalar with no sensible fallback throws immediately, naming
 * exactly which field is still unanswered.
 */
export function assemble(draft: DraftIR): DiagramIR {
  const { schemaVersion, schemaUrl } = currentSchemaConsts();

  const ir: DiagramIR = {
    "$schema": schemaUrl,
    schemaVersion,
    title: required(draft.title, "title"),
    subtitle: required(draft.subtitle, "subtitle"),
    colorTheme: { family: deriveColorFamily() },
    columns: {
      inboundActors: { items: draft.columns?.inboundActors?.items ?? [] },
      ingress: {
        gateway: {
          label: required(draft.columns?.ingress?.gateway?.label, "columns.ingress.gateway.label"),
          sublabel: draft.columns?.ingress?.gateway?.sublabel,
        },
      },
      corePlatform: {
        deployedOn: required(draft.columns?.corePlatform?.deployedOn, "columns.corePlatform.deployedOn"),
        subLayers: draft.columns?.corePlatform?.subLayers ?? [],
        systemsOfRecord: draft.columns?.corePlatform?.systemsOfRecord ?? { registryId: "systems-of-record", items: [] },
      },
      egress: {
        gateway: {
          label: required(draft.columns?.egress?.gateway?.label, "columns.egress.gateway.label"),
          sublabel: draft.columns?.egress?.gateway?.sublabel,
        },
      },
      externalSystems: { clusters: draft.columns?.externalSystems?.clusters ?? [] },
    },
    ...(draft.includeLegend === false
      ? {}
      : {
          legend: {
            entries: deriveLegendEntries(draft),
            abbreviations: deriveAbbreviations(draft),
          },
        }),
    notes: draft.notes,
    unclassified: draft.unclassified ?? [],
  };

  return ir;
}
