/**
 * Top-level section sequence — a *suggested* default order, not an
 * enforced one (see the Mechanism discussion on issue #67: order is a
 * thin, separate concern from a section's identity). Deliberately minimal
 * for now: covers the top-level jump/complete mechanics this phase's
 * first screens need. The more complex nested cursor (which item within
 * a repeatable list, mid-entry) is intentionally not designed here — it
 * gets built once a real screen with that shape exists to validate its
 * exact form against, the same reasoning that deferred it out of Phase 2.
 */
export const SECTION_ORDER = ["intro", "inboundActors", "ingress", "corePlatform", "egress", "externalSystems", "review"] as const;

export type SectionId = (typeof SECTION_ORDER)[number];

export interface NavigationState {
  current: SectionId;
  completed: Set<SectionId>;
}

export function initialNavigation(): NavigationState {
  return { current: "intro", completed: new Set() };
}

/** Marks the current section done and moves to the next one in the
 * default order — stays put if already at the last section (the caller
 * decides what "review" completing actually means). */
export function advance(nav: NavigationState): NavigationState {
  const completed = new Set(nav.completed);
  completed.add(nav.current);
  const idx = SECTION_ORDER.indexOf(nav.current);
  const next = SECTION_ORDER[idx + 1] ?? nav.current;
  return { current: next, completed };
}

/** Jumps to any section directly, regardless of default order — the
 * detour half of "detour and return". Doesn't mark anything complete;
 * only advance() does that. */
export function jumpTo(nav: NavigationState, section: SectionId): NavigationState {
  return { ...nav, current: section };
}
