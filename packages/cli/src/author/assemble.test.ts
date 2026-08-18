import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validate, render } from "@archsmith/renderer";
import type { DiagramIR } from "@archsmith/renderer";
import type { DraftIR } from "./draftIr.js";
import { assemble } from "./assemble.js";
import { titleDescriptor, subtitleDescriptor, deployedOnDescriptor, ingressGatewayDescriptors, egressGatewayDescriptors } from "./scalarDescriptors.js";
import {
  itemLens,
  inboundActorsAccessor,
  systemsOfRecordAccessor,
  clusterItemsAccessor,
  subLayerItemsAccessor,
} from "./itemLens.js";
import { clusterNameDescriptor } from "./scalarDescriptors.js";
import { resolveSubLayerAsAbsent } from "./gapResolution.js";

const examplesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../examples");

function loadRealFixture(relPath: string): DiagramIR {
  return JSON.parse(readFileSync(path.join(examplesDir, relPath), "utf-8")) as DiagramIR;
}

test("assemble() throws a specific, named error for a still-unanswered required scalar", () => {
  assert.throws(() => assemble({}), /"title" hasn't been answered yet/);
});

test("assemble() throws for a missing gateway label even once title/subtitle are set", () => {
  let draft: DraftIR = {};
  draft = titleDescriptor.write(draft, "T");
  draft = subtitleDescriptor.write(draft, "S");
  assert.throws(() => assemble(draft), /"columns\.ingress\.gateway\.label" hasn't been answered yet/);
});

/**
 * The real Phase 1 + Phase 2 guarantee: build a draft purely by writing
 * through the actual descriptors and item-lenses a wizard session would
 * use — not by copying a fixture's JSON directly — then confirm assemble()
 * produces something that genuinely validates and renders. This is
 * calibrated against minimal-valid/diagram.archsmith.json's real content,
 * but doesn't assert byte-identical output against it: that fixture's own
 * legend is deliberately minimal (one entry), while deriveLegendEntries
 * correctly produces a more complete one (see derived.test.ts, checked
 * against ticket-booking/compliance-heavy-platform instead) — a real,
 * intentional improvement, not a mismatch to paper over.
 */
test("a draft built purely through Phase 1 descriptors assembles into something that validates and renders", () => {
  const real = loadRealFixture("minimal-valid/diagram.archsmith.json");
  let draft: DraftIR = {};

  draft = titleDescriptor.write(draft, real.title);
  draft = subtitleDescriptor.write(draft, real.subtitle);
  draft = deployedOnDescriptor.write(draft, real.columns.corePlatform.deployedOn);
  draft = ingressGatewayDescriptors.label.write(draft, real.columns.ingress.gateway.label);
  draft = ingressGatewayDescriptors.sublabel.write(draft, real.columns.ingress.gateway.sublabel ?? null);
  draft = egressGatewayDescriptors.label.write(draft, real.columns.egress.gateway.label);
  draft = egressGatewayDescriptors.sublabel.write(draft, real.columns.egress.gateway.sublabel ?? null);

  const actor = real.columns.inboundActors.items[0]!;
  const actorLens = itemLens("inboundActors.0", inboundActorsAccessor(), 0);
  draft = actorLens.title.write(draft, actor.title);
  draft = actorLens.dotColor.write(draft, actor.dotColor ?? null);
  draft = actorLens.descriptionLines.write(draft, actor.descriptionLines ?? []);

  const service = real.columns.corePlatform.subLayers[0]!.rows[0]![0]!;
  const serviceLens = itemLens("core.execution-and-capability.0", subLayerItemsAccessor(0), 0);
  draft = serviceLens.title.write(draft, service.title);
  draft = serviceLens.descriptionLines.write(draft, service.descriptionLines ?? []);
  // subLayerItemsAccessor writes rows onto whatever subLayer already
  // exists at that index — it needs a registryId present for a valid
  // final IR, so set it directly here (assemble() doesn't derive this;
  // it's the one piece Phase 3's "which layer is this" step would supply).
  draft = { ...draft, columns: { ...draft.columns, corePlatform: { ...draft.columns!.corePlatform, subLayers: [{ ...draft.columns!.corePlatform!.subLayers![0]!, registryId: "execution-and-capability" }] } } };

  const sorItem = real.columns.corePlatform.systemsOfRecord.items[0]!;
  const sorLens = itemLens("sor.0", systemsOfRecordAccessor(), 0);
  draft = sorLens.title.write(draft, sorItem.title);
  draft = sorLens.descriptionLines.write(draft, sorItem.descriptionLines ?? []);

  const cluster = real.columns.externalSystems.clusters[0]!;
  draft = clusterNameDescriptor(0).write(draft, cluster.name);
  const clusterItem = cluster.items[0]!;
  const clusterLens = itemLens("cluster.0.0", clusterItemsAccessor(0), 0);
  draft = clusterLens.title.write(draft, clusterItem.title);
  draft = clusterLens.dotColor.write(draft, clusterItem.dotColor ?? null);
  draft = clusterLens.descriptionLines.write(draft, clusterItem.descriptionLines ?? []);

  const assembled = assemble(draft);

  const result = validate(assembled);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);

  const svg = render(assembled);
  assert.ok(svg.includes(real.title));
  assert.ok(svg.includes(actor.title));
  assert.ok(svg.includes(service.title));
  assert.ok(svg.includes(sorItem.title));
  assert.ok(svg.includes(clusterItem.title));
});

test("includeLegend false omits the optional legend while preserving a valid, renderable IR (issue #101)", () => {
  const draft = loadRealFixture("minimal-valid/diagram.archsmith.json") as DraftIR;
  draft.includeLegend = false;

  const ir = assemble(draft);
  assert.equal(ir.legend, undefined);
  assert.equal(validate(ir).valid, true);
  assert.equal(typeof render(ir), "string");
});

/**
 * The other real path Phase 2 needs to prove, not just the "everything
 * present" happy path above: a sub-layer resolved as genuinely absent via
 * gapResolution.ts ends up correctly in the assembled IR's `unclassified`,
 * and the whole thing still validates. corePlatform.subLayers has a real
 * minItems: 1 constraint (confirmed against the live schema), so this
 * still needs one real sub-layer alongside the resolved-absent one — not
 * every layer can be absent at once, and that's validate()'s job to
 * enforce, not something this test tries to work around.
 */
test("a sub-layer resolved as absent assembles into unclassified and still validates", () => {
  const real = loadRealFixture("minimal-valid/diagram.archsmith.json");
  let draft: DraftIR = {};

  draft = titleDescriptor.write(draft, real.title);
  draft = subtitleDescriptor.write(draft, real.subtitle);
  draft = deployedOnDescriptor.write(draft, real.columns.corePlatform.deployedOn);
  draft = ingressGatewayDescriptors.label.write(draft, real.columns.ingress.gateway.label);
  draft = egressGatewayDescriptors.label.write(draft, real.columns.egress.gateway.label);

  const actor = real.columns.inboundActors.items[0]!;
  draft = itemLens("inboundActors.0", inboundActorsAccessor(), 0).title.write(draft, actor.title);

  const service = real.columns.corePlatform.subLayers[0]!.rows[0]![0]!;
  draft = itemLens("core.execution-and-capability.0", subLayerItemsAccessor(0), 0).title.write(draft, service.title);
  draft = {
    ...draft,
    columns: {
      ...draft.columns,
      corePlatform: { ...draft.columns!.corePlatform, subLayers: [{ ...draft.columns!.corePlatform!.subLayers![0]!, registryId: "execution-and-capability" }] },
    },
  };

  const sorItem = real.columns.corePlatform.systemsOfRecord.items[0]!;
  draft = itemLens("sor.0", systemsOfRecordAccessor(), 0).title.write(draft, sorItem.title);

  const cluster = real.columns.externalSystems.clusters[0]!;
  draft = clusterNameDescriptor(0).write(draft, cluster.name);
  const clusterItem = cluster.items[0]!;
  draft = itemLens("cluster.0.0", clusterItemsAccessor(0), 0).title.write(draft, clusterItem.title);

  draft = resolveSubLayerAsAbsent("entity-layer", "No Entity Layer", "Nothing to model separately here.", draft);

  const assembled = assemble(draft);
  assert.deepEqual(assembled.unclassified, [
    { title: "No Entity Layer", description: "Nothing to model separately here.", reason: "missing-layer", location: "entity-layer" },
  ]);

  const result = validate(assembled);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});
