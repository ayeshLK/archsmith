import type { DiagramIR, ItemIR } from "@archsmith/renderer";

/**
 * Applies wizard-collected acronym answers back onto the items render()
 * flagged via its `needsAcronym` signal (issue #68) — the actual, positive
 * assertion that this walk visits items in the exact same order
 * render.ts's own aggregation does (inboundActors.items, then each Core
 * Platform sub-layer's rows in the IR's own subLayers order, then
 * systemsOfRecord.items, then each externalSystems cluster's items) is
 * covered by acronymFixup.test.ts. For a wizard-assembled IR this order
 * always matches the sub-layer registry's own governed order, since
 * CorePlatformSubLayersScreen walks governedCoreSubLayers() in that same
 * order when building the draft (see derived.ts) — this only needs to
 * replicate the IR's own stored order, not re-derive the registry's.
 *
 * Matches each `needsAcronym` entry against the next unresolved item with
 * that exact title, positionally (a two-pointer merge) rather than a
 * plain by-title lookup — needsAcronym is an ordered subsequence of this
 * same walk, so this stays correct even when two items share a title,
 * which a by-title lookup alone could not disambiguate.
 *
 * Coupled to render.ts's own traversal order by necessity: render()'s
 * `returnMeta` option (issue #68) returns only titles, not stable item
 * identifiers, so there's no other way to map an answer back to "which
 * item." If render.ts's own column/sub-layer/cluster iteration order ever
 * changes, this needs to change with it.
 */
export function applyAcronyms(ir: DiagramIR, needsAcronym: string[], answers: string[]): DiagramIR {
  if (needsAcronym.length === 0) return ir;

  let ptr = 0;
  const maybeResolve = (item: ItemIR): ItemIR => {
    if (ptr < needsAcronym.length && item.title === needsAcronym[ptr]) {
      const answer = answers[ptr];
      ptr++;
      if (answer) return { ...item, acronym: answer };
    }
    return item;
  };

  const inboundActors = { items: ir.columns.inboundActors.items.map(maybeResolve) };

  const subLayers = ir.columns.corePlatform.subLayers.map((layer) => ({
    ...layer,
    rows: layer.rows.map((row) => row.map(maybeResolve)),
  }));

  const systemsOfRecord = {
    ...ir.columns.corePlatform.systemsOfRecord,
    items: ir.columns.corePlatform.systemsOfRecord.items.map(maybeResolve),
  };

  const clusters = ir.columns.externalSystems.clusters.map((cluster) => ({
    ...cluster,
    items: cluster.items.map(maybeResolve),
  }));

  return {
    ...ir,
    columns: {
      ...ir.columns,
      inboundActors,
      corePlatform: { ...ir.columns.corePlatform, subLayers, systemsOfRecord },
      externalSystems: { clusters },
    },
  };
}
