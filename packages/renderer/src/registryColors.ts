import { getRegistry } from "@archsmith/schema";

export interface LayerToken {
  border: string;
  background: string;
  pillBackground: string | null;
  iconInner?: string;
}

export interface SemanticPillToken {
  fg: string;
  bg: string;
}

interface ColorFamily {
  status: string;
  layerTokens: Record<string, LayerToken>;
  neutralTokens: Record<string, { value: string }>;
  semanticPillTokens: Record<string, SemanticPillToken>;
}

interface ColorsRegistry {
  families: Record<string, ColorFamily>;
}

export function getColorFamily(family: string = "standard"): ColorFamily {
  const registry = getRegistry("colors") as ColorsRegistry;
  const f = registry.families[family];
  if (!f) throw new Error(`Unknown color family "${family}" — see registries/colors.json`);
  return f;
}

export function resolveLayerToken(family: string, token: string): LayerToken {
  const t = getColorFamily(family).layerTokens[token];
  if (!t) throw new Error(`Unknown layer color token "${token}" in family "${family}" — see registries/colors.json`);
  return t;
}

export function resolveNeutralToken(family: string, token: string): string {
  const t = getColorFamily(family).neutralTokens[token];
  if (!t) throw new Error(`Unknown neutral color token "${token}" in family "${family}" — see registries/colors.json`);
  return t.value;
}

export function resolveSemanticPill(family: string, semantic: string): SemanticPillToken {
  const t = getColorFamily(family).semanticPillTokens[semantic];
  if (!t) throw new Error(`Unknown semantic pill token "${semantic}" in family "${family}" — see registries/colors.json`);
  return t;
}

/**
 * Resolves a schema Pill's `semantic` field to concrete {fg, bg} colors.
 * "layer" is the one value that ISN'T a direct registry lookup — per the
 * schema's own description, it "inherits the color of whichever
 * sub-layer/item this pill is attached to," so the caller must supply that
 * layer's own accent as `layerAccent` (its border color as fg, its pill
 * background as bg). Every other semantic value maps straight to
 * `semanticPillTokens` in registries/colors.json.
 */
export function resolvePillColors(
  semantic: string,
  family: string,
  layerAccent?: { fg: string; bg: string }
): SemanticPillToken {
  if (semantic === "layer") {
    if (!layerAccent) {
      throw new Error('pill.semantic "layer" was used without a layer-accent context to inherit from');
    }
    return layerAccent;
  }
  return resolveSemanticPill(family, semantic);
}

/** Convenience: the {fg, bg} a layer-inherited pill should use, derived
 * from that layer's own accent token — border color as fg, pill background
 * (falling back to the tinted background if no dedicated pill shade
 * exists) as bg. */
export function layerAccentPillColors(layerToken: LayerToken): SemanticPillToken {
  return { fg: layerToken.border, bg: layerToken.pillBackground ?? layerToken.background };
}

export interface SubLayerRegistryEntry {
  id: string;
  order: number;
  label: string;
  accentColorToken: string;
  borderStyle: string;
  defaultTag: { label: string; semantic: string } | null;
  notes?: string;
}

interface SubLayersRegistry {
  entries: SubLayerRegistryEntry[];
}

/** All Core Platform sub-layer registry entries, in their governed
 * stacking order (see sub-layers.json's own governance note: order is
 * meaningful, a semantic flow from control-plane to data-at-rest). */
export function getSubLayerRegistryEntries(): SubLayerRegistryEntry[] {
  const registry = getRegistry("sub-layers") as SubLayersRegistry;
  return [...registry.entries].sort((a, b) => a.order - b.order);
}

export function getSubLayerRegistryEntry(id: string): SubLayerRegistryEntry {
  const entry = getSubLayerRegistryEntries().find((e) => e.id === id);
  if (!entry) {
    throw new Error(`Unknown sub-layer registryId "${id}" — adding one is a change-request event, see registries/sub-layers.json`);
  }
  return entry;
}
