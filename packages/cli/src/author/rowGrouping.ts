import type { ItemIR } from "@archsmith/renderer";

/**
 * Suggests a default row grouping for a sub-layer's flat item list —
 * pairing sequentially two at a time, with a lone leftover on its own row
 * if the count is odd. Checked against every real example with an
 * Execution & Capability layer before writing this (2-2, 2-2, 2-1
 * patterns) rather than assumed — a real v1 feature, not an edge case
 * (see issue #67). Always just a suggestion the wizard lets the user
 * accept or adjust in one step, never a forced or from-scratch layout
 * question.
 */
export function suggestRowGrouping(items: ItemIR[]): ItemIR[][] {
  const rows: ItemIR[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}
