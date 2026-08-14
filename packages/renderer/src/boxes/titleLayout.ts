import { measureText } from "../text/measure.js";
import { wrapText } from "../text/wrap.js";
import { pillWidth } from "../svg/primitives.js";
import { TITLE_PILL_GAP } from "../constants.js";

export interface TitleLayoutResult {
  lines: string[];
  pillMode: "inline" | "below" | "none";
  needsAcronym: boolean;
}

/**
 * Shared item-title layout, used by actorBox/itemBox/clusterBox alike (see
 * #68 — each previously computed a different subset of this on its own,
 * and two of the three didn't cap wrapping or support an acronym fallback
 * at all). Three tiers: single line inline (with the pill, if any); wrapped
 * to at most 2 lines with the pill dropped below; or, if even 2 lines can't
 * fit, a human-supplied `item.acronym` takes priority over wrapping, and if
 * none was supplied, `needsAcronym` is flagged so the caller can render the
 * warning pill instead of growing the box without bound.
 */
export function layoutItemTitle(
  title: string,
  acronym: string | null | undefined,
  pillLabel: string | null | undefined,
  fontSize: number,
  fontWeight: number,
  availWidth: number
): TitleLayoutResult {
  const singleLineW = measureText(title, fontSize, fontWeight) + (pillLabel ? TITLE_PILL_GAP + pillWidth(pillLabel) : 0);
  if (singleLineW <= availWidth) {
    return { lines: [title], pillMode: "inline", needsAcronym: false };
  }

  // Full title (+ pill) doesn't fit inline. A human-supplied acronym takes
  // priority over wrapping — not fit-checked against availWidth, same as
  // the original clusterBox.ts behavior this generalizes: acronyms are
  // expected to be short by construction, and re-litigating that choice
  // here isn't the renderer's call.
  if (acronym) {
    return { lines: [acronym], pillMode: "inline", needsAcronym: false };
  }

  const wrapped = wrapText(title, availWidth, fontSize, fontWeight);
  const needsAcronym = wrapped.length > 2;
  return {
    lines: needsAcronym ? wrapped.slice(0, 2) : wrapped,
    pillMode: pillLabel ? "below" : "none",
    needsAcronym,
  };
}
