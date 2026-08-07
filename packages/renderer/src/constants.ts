// Fixed rendering constants — brand identity, not a per-diagram style knob
// (corner radius, stroke width, padding, font family, neutral ink/text
// colors). Layer *accent* colors (purple/green/teal/amber as sub-layer
// borders) are supplied by callers from the governed color registry —
// these are the structural constants the box functions themselves depend
// on regardless of which accent theme is active. Ported verbatim from the
// ATS prototype, including original rationale comments.

export const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const INK = "#1B2333"; // primary border / heading ink
export const TITLE_C = "#182449";
export const BODY_C = "#48506B";
export const MUTED_C = "#6B7280";
export const LABEL_GRAY = "#4A5160";

export const PURPLE = "#5B3A9E";
export const PURPLE_BG = "#F4EFFC";
export const PURPLE_PILL_BG = "#E4D9F7";
export const GREEN = "#2F7D4F";
export const GREEN_BG = "#EAF7EC";
export const TEAL = "#177F6B";
export const TEAL_BG = "#E3F5F0";
export const TEAL_PILL_BG = "#CDEFE6";
export const AMBER = "#92600E";
export const AMBER_BG = "#FDF3D9";
export const AMBER_PILL_BG = "#F7E4B0";
export const NAVY_BORDER = "#2B3350";
export const NAVY_BG = "#F8F5FC";
export const MINT_BORDER = "#1E8A73";
export const MINT_BG = "#D9F2EC";

/** Gateway icon's inner ring+plus, ~70% brightness of MINT_BORDER —
 * pixel-measured from the reference templates, where the icon is a
 * two-tone double circle, not a single flat-color circle: both templates
 * independently landed on the same ~0.70 outer:inner brightness ratio,
 * so it's a real design detail, not an artifact of one export. */
export const MINT_ICON_INNER = "#156150";

/** External Systems cluster box border + inter-item divider line color
 * (pixel-sampled from a reference template). */
export const SOFT_DIVIDER = "#D9DCE7";

/** Spacing between two physical lines that are the same wrapped thought. */
export const LINE_H = 17;
/** Extra spacing added once, between two distinct logical lines/thoughts —
 * like paragraph-spacing vs. line-height. Without this, a logical line that
 * wraps to 2+ physical lines becomes visually indistinguishable from the
 * start of the next, distinct logical line — they read as one run-on
 * paragraph instead of separate statements. */
export const GROUP_GAP = 6;
/** Matches the LINE_H rhythm, named separately because it's specifically
 * the per-title-line increment inside cluster items (kept as two names for
 * parity with the prototype, which named them separately for the same
 * reason: they're conceptually distinct even though numerically equal). */
export const TITLE_LINE_H = 17;
/** Extra vertical space when a pill (or the acronym-needed flag) drops to
 * its own row below a wrapped title, instead of sitting inline. */
export const PILL_ROW_H = 20;

/** arch-diagram-sample-2.png measured to ~8 units, tightened to 5 by
 * explicit user preference — a deliberate deviation from the sample
 * baseline, not a measurement correction. */
export const TITLE_PILL_GAP = 5;

/** Ceiling on how wide a single item's one-line content (title + gap +
 * pill) is allowed to demand before the box stops growing to fit it.
 * 309.66 is the real need of "HR / People GraphQL Service" + its pill
 * (the widest validated item) — 330 adds ~6.5% headroom so trivial length
 * variations don't immediately trip into wrap/acronym territory, without
 * making the ceiling meaningless. Beyond this: wrap the title to at most
 * 2 lines within the ceiling (pill moves to its own row below); if even
 * 2 lines can't fit, an acronym becomes mandatory — a human call, never
 * the renderer's to invent. */
export const MAX_INLINE_WIDTH = 330;
