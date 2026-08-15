import { test } from "node:test";
import assert from "node:assert/strict";
import type { DraftIR } from "./draftIr.js";
import {
  itemLens,
  inboundActorsAccessor,
  systemsOfRecordAccessor,
  clusterItemsAccessor,
  subLayerItemsAccessor,
  applySuggestedRowGrouping,
} from "./itemLens.js";

test("reading a field from an empty draft returns undefined, not a throw", () => {
  const draft: DraftIR = {};
  const lens = itemLens("inboundActors.0", inboundActorsAccessor(), 0);
  assert.equal(lens.title.read(draft), undefined);
  assert.equal(lens.eyebrow.read(draft), undefined);
  assert.equal(lens.descriptionLines.read(draft), undefined);
});

test("writing title to an empty draft creates the item, readable back through the same lens", () => {
  const draft: DraftIR = {};
  const lens = itemLens("inboundActors.0", inboundActorsAccessor(), 0);
  const updated = lens.title.write(draft, "Employee Web App");
  assert.equal(lens.title.read(updated), "Employee Web App");
});

test("writing one field merges onto the existing item — a sibling field set outside the lens survives untouched", () => {
  // Simulates a field the guided flow's item sub-flow deliberately doesn't
  // cover (pill/icon/tagOverride — v1.1) already being present on an item,
  // e.g. from a loaded/edited file in the eventual Phase 1.5. Editing the
  // title through the lens must not silently drop it.
  const draft: DraftIR = {
    columns: {
      inboundActors: {
        items: [{ title: "Old Title", pill: { label: "GAP", semantic: "warning" } } as never],
      },
    },
  };
  const lens = itemLens("inboundActors.0", inboundActorsAccessor(), 0);
  const updated = lens.title.write(draft, "New Title");
  const item = updated.columns!.inboundActors!.items![0]!;
  assert.equal(item.title, "New Title");
  assert.deepEqual((item as never as { pill: unknown }).pill, { label: "GAP", semantic: "warning" });
});

test("writing descriptionLines and dotColor independently don't clobber each other or the title", () => {
  const draft: DraftIR = {};
  const lens = itemLens("actor.0", inboundActorsAccessor(), 0);
  let d = lens.title.write(draft, "In-Store Devices");
  d = lens.descriptionLines.write(d, ["Point-of-sale terminals"]);
  d = lens.dotColor.write(d, "mint");
  const item = d.columns!.inboundActors!.items![0]!;
  assert.equal(item.title, "In-Store Devices");
  assert.deepEqual(item.descriptionLines, ["Point-of-sale terminals"]);
  assert.equal(item.dotColor, "mint");
});

test("systemsOfRecordAccessor and clusterItemsAccessor round-trip independently of each other", () => {
  const draft: DraftIR = {};
  const sorLens = itemLens("sor.0", systemsOfRecordAccessor(), 0);
  const clusterLens = itemLens("cluster.0.0", clusterItemsAccessor(0), 0);

  let d = sorLens.title.write(draft, "Primary Database");
  d = clusterLens.title.write(d, "Notification Delivery Service");

  assert.equal(sorLens.title.read(d), "Primary Database");
  assert.equal(clusterLens.title.read(d), "Notification Delivery Service");
  assert.equal(d.columns!.corePlatform!.systemsOfRecord!.items!.length, 1);
  assert.equal(d.columns!.externalSystems!.clusters![0]!.items!.length, 1);
});

test("subLayerItemsAccessor flattens rows for reading, regardless of row grouping", () => {
  const draft: DraftIR = {
    columns: {
      corePlatform: {
        subLayers: [
          {
            registryId: "execution-and-capability",
            rows: [
              [{ title: "Service A" }, { title: "Service B" }],
              [{ title: "Service C" }],
            ],
          },
        ],
      },
    },
  };
  const items = subLayerItemsAccessor(0).get(draft);
  assert.deepEqual(items?.map((i) => i.title), ["Service A", "Service B", "Service C"]);
});

test("editing one item's title preserves the existing row grouping shape (2-1 stays 2-1)", () => {
  const draft: DraftIR = {
    columns: {
      corePlatform: {
        subLayers: [
          {
            registryId: "execution-and-capability",
            rows: [
              [{ title: "Service A" }, { title: "Service B" }],
              [{ title: "Service C" }],
            ],
          },
        ],
      },
    },
  };
  const lens = itemLens("core.0.1", subLayerItemsAccessor(0), 1); // "Service B", index 1 in the flattened list
  const updated = lens.title.write(draft, "Service B Renamed");
  const rows = updated.columns!.corePlatform!.subLayers![0]!.rows;
  assert.deepEqual(
    rows.map((r) => r.map((i) => i.title)),
    [["Service A", "Service B Renamed"], ["Service C"]]
  );
});

test("subLayerItemsAccessor seeds a brand-new sub-layer instance with the given registryId", () => {
  const draft: DraftIR = {};
  const accessor = subLayerItemsAccessor(0, "discovery-and-governance");
  const updated = accessor.set(draft, [{ title: "API Gateway Policy" }]);
  const subLayer = updated.columns!.corePlatform!.subLayers![0]!;
  assert.equal(subLayer.registryId, "discovery-and-governance");
  assert.deepEqual(subLayer.rows, [[{ title: "API Gateway Policy" }]]);
});

test("subLayerItemsAccessor's registryId fallback is ignored once the instance already exists", () => {
  const draft: DraftIR = {
    columns: {
      corePlatform: {
        subLayers: [{ registryId: "entity-layer", rows: [[{ title: "Order" }]] }],
      },
    },
  };
  const accessor = subLayerItemsAccessor(0, "discovery-and-governance");
  const updated = accessor.set(draft, [{ title: "Order" }, { title: "Invoice" }]);
  assert.equal(updated.columns!.corePlatform!.subLayers![0]!.registryId, "entity-layer");
});

test("adding a new item (count changes) falls back to one-per-row, not a guessed pairing", () => {
  const draft: DraftIR = {
    columns: {
      corePlatform: {
        subLayers: [{ registryId: "execution-and-capability", rows: [[{ title: "Service A" }, { title: "Service B" }]] }],
      },
    },
  };
  const accessor = subLayerItemsAccessor(0);
  const current = accessor.get(draft) ?? [];
  const withNewItem = accessor.set(draft, [...current, { title: "Service C" }]);
  const rows = withNewItem.columns!.corePlatform!.subLayers![0]!.rows;
  assert.deepEqual(
    rows.map((r) => r.map((i) => i.title)),
    [["Service A"], ["Service B"], ["Service C"]]
  );
});

test("applySuggestedRowGrouping re-pairs a one-per-row stack into the real 2-2-1 shape (issue #88)", () => {
  const draft: DraftIR = {
    columns: {
      corePlatform: {
        subLayers: [
          {
            registryId: "execution-and-capability",
            rows: [[{ title: "Service A" }], [{ title: "Service B" }], [{ title: "Service C" }]],
          },
        ],
      },
    },
  };
  const updated = applySuggestedRowGrouping(0, draft);
  const rows = updated.columns!.corePlatform!.subLayers![0]!.rows;
  assert.deepEqual(
    rows.map((r) => r.map((i) => i.title)),
    [["Service A", "Service B"], ["Service C"]]
  );
});

test("applySuggestedRowGrouping is a no-op when there's no instance at that index yet", () => {
  const draft: DraftIR = {};
  assert.equal(applySuggestedRowGrouping(0, draft), draft);
});
