import type { GapNoteIR } from "@archsmith/renderer";
import type { DraftIR } from "./draftIr.js";
import type { SectionStatus } from "./fieldDescriptor.js";

/**
 * Status of one governed Core Platform sub-layer, derived directly from
 * the draft's existing shape — no separate "pending" flag needs to be
 * stored anywhere. "I'm not sure yet" and "remind me to come back to
 * this" (the guided flow's two not-yet-resolved prompt options) are the
 * same underlying state here, distinguished only in prompt copy, never in
 * data — resolving one of a diagram's real ambiguities isn't a second
 * kind of fact from not having gotten to it yet.
 */
export function subLayerStatus(registryId: string, draft: DraftIR): SectionStatus {
  const hasInstance = (draft.columns?.corePlatform?.subLayers ?? []).some((s) => s.registryId === registryId);
  if (hasInstance) return "done";
  const hasGapNote = (draft.unclassified ?? []).some((g) => g.reason === "missing-layer" && g.location === registryId);
  return hasGapNote ? "absent" : "pending";
}

/**
 * Records a governed sub-layer as genuinely absent — appends a gapNote
 * (reason: missing-layer), replacing any earlier one for the same
 * registryId rather than accumulating stale duplicates. Never touches or
 * removes an actual sub-layer instance; that's a distinct action a caller
 * takes explicitly, not implied by resolving a gap.
 */
export function resolveSubLayerAsAbsent(registryId: string, title: string, description: string, draft: DraftIR): DraftIR {
  const gapNote: GapNoteIR = { title, description, reason: "missing-layer", location: registryId };
  const existing = (draft.unclassified ?? []).filter((g) => !(g.reason === "missing-layer" && g.location === registryId));
  return { ...draft, unclassified: [...existing, gapNote] };
}

/**
 * Removes a stale "missing-layer" gapNote for this registryId — call
 * when a real instance is added for a layer previously resolved absent,
 * so the assembled IR's `unclassified` never carries a gap note that's no
 * longer true. A no-op (returns the same draft) if there's nothing to clear.
 */
export function clearSubLayerGapNote(registryId: string, draft: DraftIR): DraftIR {
  const existing = draft.unclassified ?? [];
  const filtered = existing.filter((g) => !(g.reason === "missing-layer" && g.location === registryId));
  if (filtered.length === existing.length) return draft;
  return { ...draft, unclassified: filtered };
}
