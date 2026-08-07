import type { ItemIR, PillIR } from "../ir.js";
import type { ItemBoxPill } from "../boxes/itemBox.js";
import { resolveLayerToken, resolvePillColors, layerAccentPillColors, type LayerToken } from "../registryColors.js";
import { MUTED_C } from "../constants.js";

/**
 * Resolves an ItemIR's `dotColor` (a registry token name, per the schema —
 * "Color token used as a plain dot when icon is null") to an actual hex
 * value. `icon` isn't rendered yet — the icon catalog is still a
 * placeholder (registries/icons.json) — so this is the only path, matching
 * the established fallback rule: never force a mismatched icon, fall back
 * to the plain dot. If dotColor is also absent, falls back to a neutral
 * gray rather than guessing a layer accent that has no basis in the IR.
 */
export function resolveDotColor(item: ItemIR, family: string): string {
  if (item.dotColor) {
    return resolveLayerToken(family, item.dotColor).border;
  }
  return MUTED_C;
}

/** Resolves an ItemIR's pill (schema Pill: {label, semantic}) to the
 * concrete {fg, bg, label} an ItemBox/ClusterBox primitive needs,
 * given the layer accent context (for "layer"-semantic pills). */
export function resolveItemPill(pill: PillIR | null | undefined, family: string, layerAccent?: LayerToken): ItemBoxPill | null {
  if (!pill) return null;
  const accentPill = layerAccent ? layerAccentPillColors(layerAccent) : undefined;
  const { fg, bg } = resolvePillColors(pill.semantic, family, accentPill);
  return { label: pill.label, fg, bg };
}
