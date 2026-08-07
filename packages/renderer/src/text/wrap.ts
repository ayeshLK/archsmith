import { measureText } from "./measure.js";

/** For unbreakable-by-space tokens: resource paths, snake_case/kebab-case
 * identifiers, dotted names — break at these rather than overflowing, and
 * rather than shrinking font size or special-casing "is this a URL". Ported
 * verbatim from the ATS prototype's `_SECONDARY_BREAK_CHARS`. */
const SECONDARY_BREAK_CHARS = "/-_.?&";

/**
 * A single space-free token that's still too wide on its own: break it at
 * the last secondary-delimiter position that fits, recursively. Falls back
 * to a hard character-boundary cut (binary search) only if the token has no
 * usable delimiter to break on at all. Direct port of the prototype's
 * `_split_token`.
 */
function splitToken(word: string, maxWidth: number, size: number, weight: number): string[] {
  if (measureText(word, size, weight) <= maxWidth) return [word];

  let bestCut: number | null = null;
  for (let i = 0; i < word.length; i++) {
    if (SECONDARY_BREAK_CHARS.includes(word[i]!) && i > 0) {
      if (measureText(word.slice(0, i + 1), size, weight) <= maxWidth) {
        bestCut = i + 1;
      }
    }
  }

  if (bestCut === null) {
    let lo = 1;
    let hi = word.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (measureText(word.slice(0, mid), size, weight) <= maxWidth) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    bestCut = Math.max(lo, 1);
  }

  const head = word.slice(0, bestCut);
  const rest = word.slice(bestCut);
  return rest ? [head, ...splitToken(rest, maxWidth, size, weight)] : [head];
}

/**
 * Greedy word-wrap using real font-metric measurement (measureText), so
 * wrapping decisions are as accurate as everything else in this renderer —
 * never an eyeballed line-length guess. Words that alone exceed maxWidth
 * (long resource paths, snake_case identifiers) break at secondary
 * delimiters instead of overflowing or requiring font-size/URL-detection
 * special cases. Direct port of the ATS prototype's `wrap_text`.
 */
export function wrapText(text: string, maxWidth: number, size: number, weight: number = 400): string[] {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(" ")) {
    const pieces = measureText(word, size, weight) > maxWidth ? splitToken(word, maxWidth, size, weight) : [word];
    for (const piece of pieces) {
      const candidate = `${current} ${piece}`.trim();
      if (current && measureText(candidate, size, weight) > maxWidth) {
        lines.push(current);
        current = piece;
      } else {
        current = candidate;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}
