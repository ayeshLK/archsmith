import { getRegistry } from "@archsmith/schema";
import type { LegendEntryIR, AbbreviationIR, ItemIR } from "@archsmith/renderer";
import type { DraftIR } from "./draftIr.js";

export interface SubLayerRegistryEntry {
  id: string;
  label: string;
  accentColorToken: string;
}

export function subLayerRegistryEntries(): SubLayerRegistryEntry[] {
  return (getRegistry("sub-layers") as { entries: SubLayerRegistryEntry[] }).entries;
}

/** The 3 governed sub-layers a Core Platform diagram can walk through and
 * decide on (done/absent/pending) — "systems-of-record" is excluded since
 * it's a distinct, always-required section (see systemsOfRecordAccessor),
 * not one of the optional stacked sub-layers. Registry order is meaningful
 * (see sub-layers.json's own governance note) and preserved here as-is. */
export function governedCoreSubLayers(): SubLayerRegistryEntry[] {
  return subLayerRegistryEntries().filter((e) => e.id !== "systems-of-record");
}

// Fixed convention, not derived per-diagram — Ingress/Egress lanes share
// this color with the "via egress" semantic pill (see registries/colors.json).
const GATEWAY_COLOR_TOKEN = "mint";
const GATEWAY_LEGEND_LABEL = "Ingress / Egress gateways";

/**
 * legend.entries is mandatory but fully derivable from what actually got
 * used — checked against every real example with this shape (ticket-booking,
 * compliance-heavy-platform): every used Core Platform sub-layer gets an
 * entry, Systems of Record and the Ingress/Egress gateway color always do
 * (both mandatory in any valid diagram — see ir.ts's DiagramIR, neither
 * field is optional), and Inbound Actors/External Systems never do, since
 * neither uses one single governed accent color the way a sub-layer or a
 * gateway does. Never asked as a user-facing question.
 */
export function deriveLegendEntries(draft: DraftIR): LegendEntryIR[] {
  const registry = subLayerRegistryEntries();
  const entries: LegendEntryIR[] = [];

  const usedSubLayerIds = new Set((draft.columns?.corePlatform?.subLayers ?? []).map((s) => s.registryId));
  for (const entry of registry.filter((e) => e.id !== "systems-of-record")) {
    if (usedSubLayerIds.has(entry.id)) {
      entries.push({ colorToken: entry.accentColorToken, label: entry.label });
    }
  }

  const sorRegistryId = draft.columns?.corePlatform?.systemsOfRecord?.registryId ?? "systems-of-record";
  const sorEntry = registry.find((e) => e.id === sorRegistryId);
  if (sorEntry) {
    entries.push({ colorToken: sorEntry.accentColorToken, label: sorEntry.label });
  }

  entries.push({ colorToken: GATEWAY_COLOR_TOKEN, label: GATEWAY_LEGEND_LABEL });
  return entries;
}

function collectAllItems(draft: DraftIR): ItemIR[] {
  const items: ItemIR[] = [];
  items.push(...(draft.columns?.inboundActors?.items ?? []));
  for (const subLayer of draft.columns?.corePlatform?.subLayers ?? []) {
    items.push(...subLayer.rows.flat());
  }
  items.push(...(draft.columns?.corePlatform?.systemsOfRecord?.items ?? []));
  for (const cluster of draft.columns?.externalSystems?.clusters ?? []) {
    items.push(...cluster.items);
  }
  return items;
}

/**
 * One entry per item that already has a real `acronym` set — see
 * titleLayout.ts and #68 for how/when an item actually needs one (a
 * post-render fixup, not an upfront question). This simply mirrors
 * whatever's already on the items by the time it's called, across every
 * column an item can appear in.
 */
export function deriveAbbreviations(draft: DraftIR): AbbreviationIR[] {
  return collectAllItems(draft)
    .filter((item) => item.acronym)
    .map((item) => ({ acronym: item.acronym!, fullName: item.title }));
}

/** Only one value is currently valid — colors.json's accessible family
 * is still a governed placeholder with no complete palette. Never asked;
 * there's nothing to choose yet. */
export function deriveColorFamily(): "standard" {
  return "standard";
}
