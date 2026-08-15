import type { ItemIR } from "@archsmith/renderer";
import type { DraftIR } from "./draftIr.js";
import type { FieldDescriptor } from "./fieldDescriptor.js";
import { suggestRowGrouping } from "./rowGrouping.js";

/**
 * How to reach the flat array of items a set of item-lens descriptors
 * operates on. Supplied by the caller so this module never needs to know
 * whether that array lives at columns.inboundActors.items,
 * columns.corePlatform.systemsOfRecord.items, one cluster's items, or a
 * flattened view of one sub-layer's rows (see subLayerItemsAccessor,
 * below, for that last, more involved case).
 */
export interface ItemArrayAccessor {
  get(draft: DraftIR): ItemIR[] | undefined;
  set(draft: DraftIR, items: ItemIR[]): DraftIR;
}

function readItem(accessor: ItemArrayAccessor, index: number, draft: DraftIR): ItemIR | undefined {
  return accessor.get(draft)?.[index];
}

/** Merges the patch onto the existing item at `index` (creating it with an
 * empty title if it doesn't exist yet) — never reconstructs the item from
 * only the fields this module knows about, so pill/icon/acronym (not part
 * of the guided item sub-flow — see itemLens() below) survive untouched
 * once Phase 1.5's edit direction can produce items that already have them. */
function writeItem(accessor: ItemArrayAccessor, index: number, draft: DraftIR, patch: Partial<ItemIR>): DraftIR {
  const items = accessor.get(draft) ?? [];
  const existing = items[index] ?? { title: "" };
  const updated = [...items];
  updated[index] = { ...existing, ...patch };
  return accessor.set(draft, updated);
}

export interface ItemFieldDescriptors {
  title: FieldDescriptor<string>;
  eyebrow: FieldDescriptor<string | null>;
  descriptionLines: FieldDescriptor<string[]>;
  dotColor: FieldDescriptor<string | null>;
}

/**
 * The schema's own item shape "unifies actor boxes, execution/entity/
 * systems-of-record boxes, and external-system items" (diagram-schema.json's
 * $defs.item description). This is that unification's authoring-side
 * counterpart: one factory, instantiated wherever an item is created,
 * rather than five hand-copied sets of descriptors. Deliberately covers
 * only title/eyebrow/descriptionLines/dotColor — `pill`/`icon`/`tagOverride`
 * are v1.1 (see issue #67's scope cuts), and `acronym` is a post-render
 * fixup triggered by render()'s own needsAcronym signal (#68/#67 Phase 0),
 * not an upfront question in this sub-flow.
 */
export function itemLens(idPrefix: string, accessor: ItemArrayAccessor, index: number): ItemFieldDescriptors {
  return {
    title: {
      id: `${idPrefix}.title`,
      kind: "text",
      hint: "The name that appears in the box.",
      read: (draft) => readItem(accessor, index, draft)?.title,
      write: (draft, value) => writeItem(accessor, index, draft, { title: value }),
    },
    eyebrow: {
      id: `${idPrefix}.eyebrow`,
      kind: "optionalText",
      hint: 'A short (1-3 word) category above the title, e.g. "API management" — skip if none fits naturally.',
      read: (draft) => readItem(accessor, index, draft)?.eyebrow ?? undefined,
      write: (draft, value) => writeItem(accessor, index, draft, { eyebrow: value }),
    },
    descriptionLines: {
      id: `${idPrefix}.descriptionLines`,
      kind: "repeatable",
      hint: "One or more short sentences about what this does — Enter on an empty line to finish.",
      read: (draft) => readItem(accessor, index, draft)?.descriptionLines,
      write: (draft, value) => writeItem(accessor, index, draft, { descriptionLines: value }),
    },
    dotColor: {
      id: `${idPrefix}.dotColor`,
      kind: "pickOne",
      hint: "An optional color accent for this item.",
      read: (draft) => readItem(accessor, index, draft)?.dotColor ?? undefined,
      write: (draft, value) => writeItem(accessor, index, draft, { dotColor: value }),
    },
  };
}

/** Inbound Actors: a plain flat array, columns.inboundActors.items. */
export function inboundActorsAccessor(): ItemArrayAccessor {
  return {
    get: (draft) => draft.columns?.inboundActors?.items,
    set: (draft, items) => ({
      ...draft,
      columns: { ...draft.columns, inboundActors: { ...draft.columns?.inboundActors, items } },
    }),
  };
}

/** Systems of Record: a plain flat array, columns.corePlatform.systemsOfRecord.items. */
export function systemsOfRecordAccessor(): ItemArrayAccessor {
  return {
    get: (draft) => draft.columns?.corePlatform?.systemsOfRecord?.items,
    set: (draft, items) => ({
      ...draft,
      columns: {
        ...draft.columns,
        corePlatform: {
          ...draft.columns?.corePlatform,
          systemsOfRecord: {
            ...(draft.columns?.corePlatform?.systemsOfRecord ?? { registryId: "systems-of-record" }),
            items,
          },
        },
      },
    }),
  };
}

/** One External Systems cluster's items: columns.externalSystems.clusters[clusterIndex].items. */
export function clusterItemsAccessor(clusterIndex: number): ItemArrayAccessor {
  return {
    get: (draft) => draft.columns?.externalSystems?.clusters?.[clusterIndex]?.items,
    set: (draft, items) => {
      const clusters = draft.columns?.externalSystems?.clusters ?? [];
      const existing = clusters[clusterIndex] ?? { name: "" };
      const updated = [...clusters];
      updated[clusterIndex] = { ...existing, items };
      return { ...draft, columns: { ...draft.columns, externalSystems: { ...draft.columns?.externalSystems, clusters: updated } } };
    },
  };
}

function unflattenPreservingShape(existingRows: ItemIR[][] | undefined, newItems: ItemIR[]): ItemIR[][] {
  const oldRows = existingRows ?? [];
  const oldFlatCount = oldRows.reduce((sum, row) => sum + row.length, 0);
  if (newItems.length === oldFlatCount) {
    // Same item count as before this write — preserve each row's size,
    // substituting items positionally, so editing one item's title (say)
    // never disturbs an already-decided row pairing.
    let cursor = 0;
    return oldRows.map((row) => {
      const newRow = newItems.slice(cursor, cursor + row.length);
      cursor += row.length;
      return newRow;
    });
  }
  // Item count changed (one was added or removed) — fall back to one item
  // per row for now. Real pairing is a separate, explicit suggestion step
  // (rowGrouping.ts), run once all items for this layer are entered, not
  // something this accessor tries to guess at on every single edit.
  return newItems.map((item) => [item]);
}

/**
 * One Core Platform sub-layer's items, flattened — the item-lens factory
 * (and a human editing one item at a time) never needs to think in terms
 * of `rows: ItemIR[][]`; row grouping is deliberately a separate concern,
 * layered on top of this flat view, not baked into how individual items
 * are read or written. `registryId` is only used the first time this
 * index is written — the fallback for a brand-new sub-layer instance
 * that doesn't exist in the draft yet; once it exists, its own stored
 * registryId is preserved regardless of what's passed here.
 */
export function subLayerItemsAccessor(subLayerIndex: number, registryId?: string): ItemArrayAccessor {
  return {
    get: (draft) => {
      const rows = draft.columns?.corePlatform?.subLayers?.[subLayerIndex]?.rows;
      return rows?.flat();
    },
    set: (draft, items) => {
      const subLayers = draft.columns?.corePlatform?.subLayers ?? [];
      const existing = subLayers[subLayerIndex];
      const rows = unflattenPreservingShape(existing?.rows, items);
      const updated = [...subLayers];
      updated[subLayerIndex] = { ...(existing ?? { registryId: registryId ?? "" }), rows };
      return { ...draft, columns: { ...draft.columns, corePlatform: { ...draft.columns?.corePlatform, subLayers: updated } } };
    },
  };
}

/**
 * Replaces a finished sub-layer's row shape with `suggestRowGrouping`'s
 * paired arrangement — called once, when a sub-layer's item list is done
 * (see CorePlatformSubLayersScreen), not on every edit. Adding items one
 * at a time only ever goes through `unflattenPreservingShape`'s
 * same-count-preserves/different-count-falls-back-to-one-per-row logic
 * above, which never re-groups a list that's actually finished — left
 * unaddressed, every sub-layer ends up a vertical stack of one-item rows
 * instead of the paired columns real diagrams use (issue #88).
 */
export function applySuggestedRowGrouping(subLayerIndex: number, draft: DraftIR): DraftIR {
  const subLayers = draft.columns?.corePlatform?.subLayers ?? [];
  const existing = subLayers[subLayerIndex];
  if (!existing) return draft;
  const regrouped = suggestRowGrouping(existing.rows.flat());
  const updated = [...subLayers];
  updated[subLayerIndex] = { ...existing, rows: regrouped };
  return { ...draft, columns: { ...draft.columns, corePlatform: { ...draft.columns?.corePlatform, subLayers: updated } } };
}
