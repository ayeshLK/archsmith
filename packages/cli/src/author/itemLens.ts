import type { ItemIR, PillIR } from "@archsmith/renderer";
import type { DraftIR } from "./draftIr.js";
import type { FieldDescriptor } from "./fieldDescriptor.js";
import { suggestRowGrouping } from "./rowGrouping.js";

/**
 * Which pill sub-flow ItemSubFlow should run for this anchor point, driven
 * by what the renderer itself actually supports (see issue #97's design
 * comment) rather than a preference:
 *  - "full": free-text label, then (if non-empty) a semantic picker over
 *    the 4 semantics that are ever meaningful outside External Systems —
 *    Systems of Record and Core Platform sub-layers.
 *  - "viaEgressOnly": a single yes/no — External Systems is the only
 *    section where `renderExternalSystems` reads `pill.label` at all, and
 *    it ignores `pill.semantic` entirely, always resolving "viaEgress"'s
 *    color; every real example's via-egress pill also uses the identical
 *    label text, so there's no real text or semantic choice to ask about.
 *  - "none": no pill step at all — Inbound Actors' `actorBox()` has no
 *    pill rendering support whatsoever, so there's nothing to guide
 *    anyone toward; this isn't a curation choice, it's a capability gap.
 */
export type PillMode = "full" | "viaEgressOnly" | "none";

/**
 * How to reach the flat array of items a set of item-lens descriptors
 * operates on. Supplied by the caller so this module never needs to know
 * whether that array lives at columns.inboundActors.items,
 * columns.corePlatform.systemsOfRecord.items, one cluster's items, or a
 * flattened view of one sub-layer's rows (see subLayerItemsAccessor,
 * below, for that last, more involved case). Also carries the two other
 * per-anchor-point behaviors ItemSubFlow needs (pillMode, eyebrowEnabled)
 * — this is already the one place each anchor point's own particulars
 * live, so it's the natural home for these too rather than a second,
 * separately-threaded set of options.
 */
export interface ItemArrayAccessor {
  get(draft: DraftIR): ItemIR[] | undefined;
  set(draft: DraftIR, items: ItemIR[]): DraftIR;
  pillMode: PillMode;
  eyebrowEnabled: boolean;
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
  pill: FieldDescriptor<PillIR | null>;
  eyebrow: FieldDescriptor<string | null>;
  descriptionLines: FieldDescriptor<string[]>;
  dotColor: FieldDescriptor<string | null>;
  /** Which pill sub-flow ItemSubFlow should run — see PillMode. Plain
   * metadata copied from the accessor, not itself a FieldDescriptor: it
   * picks which UI to show, it isn't a value read from/written to the
   * draft. */
  pillMode: PillMode;
  /** Whether ItemSubFlow should ask for eyebrow at all for this anchor
   * point — see subLayerItemsAccessor's own doc for why this is scoped to
   * discovery-and-governance rather than asked everywhere (issue #97). */
  eyebrowEnabled: boolean;
}

/**
 * The schema's own item shape "unifies actor boxes, execution/entity/
 * systems-of-record boxes, and external-system items" (diagram-schema.json's
 * $defs.item description). This is that unification's authoring-side
 * counterpart: one factory, instantiated wherever an item is created,
 * rather than five hand-copied sets of descriptors. Covers
 * title/pill/eyebrow/descriptionLines/dotColor — `icon`/`tagOverride`
 * stay v1.1 (see issue #67's scope cuts), and `acronym` is a post-render
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
    pill: {
      id: `${idPrefix}.pill`,
      kind: "pill",
      hint: 'A small badge on the box, next to its title — e.g. "PRIMARY" on the one true system of record.',
      read: (draft) => readItem(accessor, index, draft)?.pill ?? undefined,
      write: (draft, value) => writeItem(accessor, index, draft, { pill: value }),
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
    pillMode: accessor.pillMode,
    eyebrowEnabled: accessor.eyebrowEnabled,
  };
}

/** Inbound Actors: a plain flat array, columns.inboundActors.items.
 * pillMode "none": actorBox.ts has no `pill` field at all — nothing would
 * render, so there's no pill step to offer (issue #97). */
export function inboundActorsAccessor(): ItemArrayAccessor {
  return {
    get: (draft) => draft.columns?.inboundActors?.items,
    set: (draft, items) => ({
      ...draft,
      columns: { ...draft.columns, inboundActors: { ...draft.columns?.inboundActors, items } },
    }),
    pillMode: "none",
    eyebrowEnabled: false,
  };
}

/** Systems of Record: a plain flat array, columns.corePlatform.systemsOfRecord.items.
 * pillMode "full": renderRow/resolveItemPill resolves every non-viaEgress
 * semantic here for real (issue #97). */
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
    pillMode: "full",
    eyebrowEnabled: false,
  };
}

/** One External Systems cluster's items: columns.externalSystems.clusters[clusterIndex].items.
 * pillMode "viaEgressOnly": renderExternalSystems ignores pill.semantic
 * entirely and always resolves "viaEgress"'s color for the whole column —
 * there's no real semantic choice to ask about here (issue #97). */
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
    pillMode: "viaEgressOnly",
    eyebrowEnabled: false,
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
 *
 * pillMode "full": renderRow/resolveItemPill resolves every non-viaEgress
 * semantic here for real, same as Systems of Record (issue #97).
 *
 * eyebrowEnabled only for "discovery-and-governance": checked against every
 * real example, eyebrow's 6 real uses were 100% concentrated there
 * (Policy, Identity, API management, ...) and 0% in execution-and-capability
 * or entity-layer — those two are homogeneous enough (business logic;
 * data stores) that an item's sub-layer already tells you what kind of
 * thing it is, unlike Discovery and Governance's own grab-bag of policy/
 * identity/catalog concerns (issue #97).
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
    pillMode: "full",
    eyebrowEnabled: registryId === "discovery-and-governance",
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
