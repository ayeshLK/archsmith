import { randomUUID } from "node:crypto";

/**
 * Backs the `render` tool's large-payload path (see issue #55 and the
 * `resource_link` design discussion): a render whose SVG exceeds
 * INLINE_THRESHOLD_BYTES is stored here and returned as a `resource_link`
 * instead of being inlined in the tool result, so the tool call itself
 * stays small regardless of how large the underlying diagram is — unlike
 * subsetting (which only shrinks the fixed font-embedding cost), this has
 * no ceiling on render size.
 *
 * Bounded by insertion order, not true LRU (nothing here bumps an entry on
 * read) — renders are typically fetched once shortly after being produced,
 * so a simple capacity cap is enough to keep a long-running server's
 * memory bounded without the extra bookkeeping true LRU would need.
 */
export const INLINE_THRESHOLD_BYTES = 25_000;
export const MAX_ENTRIES = 20;

const store = new Map<string, string>();

/** Stores `svg` and returns a fresh id to retrieve it by. Evicts the
 * oldest-inserted entry once the store exceeds MAX_ENTRIES. */
export function saveRender(svg: string): string {
  const id = randomUUID();
  store.set(id, svg);
  if (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value as string;
    store.delete(oldest);
  }
  return id;
}

/** Returns the stored SVG for `id`, or undefined if it was never stored or
 * has since been evicted. */
export function getRender(id: string): string | undefined {
  return store.get(id);
}
