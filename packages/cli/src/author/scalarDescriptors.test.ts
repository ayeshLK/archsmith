import { test } from "node:test";
import assert from "node:assert/strict";
import type { DraftIR } from "./draftIr.js";
import {
  titleDescriptor,
  subtitleDescriptor,
  deployedOnDescriptor,
  ingressGatewayDescriptors,
  egressGatewayDescriptors,
  clusterNameDescriptor,
} from "./scalarDescriptors.js";

test("title and subtitle round-trip independently", () => {
  let draft: DraftIR = {};
  draft = titleDescriptor.write(draft, "My Diagram");
  draft = subtitleDescriptor.write(draft, "A subtitle");
  assert.equal(titleDescriptor.read(draft), "My Diagram");
  assert.equal(subtitleDescriptor.read(draft), "A subtitle");
});

test("deployedOn writes into corePlatform without disturbing sibling corePlatform fields", () => {
  const draft: DraftIR = {
    columns: { corePlatform: { systemsOfRecord: { registryId: "systems-of-record", items: [{ title: "DB" }] } } },
  };
  const updated = deployedOnDescriptor.write(draft, "AWS EKS");
  assert.equal(deployedOnDescriptor.read(updated), "AWS EKS");
  assert.equal(updated.columns!.corePlatform!.systemsOfRecord!.items!.length, 1);
});

test("ingress and egress gateway descriptors don't collide with each other", () => {
  let draft: DraftIR = {};
  draft = ingressGatewayDescriptors.label.write(draft, "API Gateway");
  draft = egressGatewayDescriptors.label.write(draft, "Outbound Gateway");
  assert.equal(ingressGatewayDescriptors.label.read(draft), "API Gateway");
  assert.equal(egressGatewayDescriptors.label.read(draft), "Outbound Gateway");
});

test("a gateway's sublabel can be written without needing the label set first", () => {
  const draft: DraftIR = {};
  const updated = ingressGatewayDescriptors.sublabel.write(draft, "Production Runtime");
  assert.equal(ingressGatewayDescriptors.sublabel.read(updated), "Production Runtime");
  assert.equal(ingressGatewayDescriptors.label.read(updated), "");
});

test("both real ingress/egress hints come from the authoring glossary, not hardcoded copy", () => {
  assert.ok(ingressGatewayDescriptors.label.hint.length > 0);
  assert.ok(egressGatewayDescriptors.label.hint.length > 0);
  assert.notEqual(ingressGatewayDescriptors.label.hint, egressGatewayDescriptors.label.hint);
});

test("clusterNameDescriptor is anchored to its own cluster index, independent of others", () => {
  let draft: DraftIR = {};
  draft = clusterNameDescriptor(0).write(draft, "Shared Internal Services");
  draft = clusterNameDescriptor(1).write(draft, "Third-Party Integrations");
  assert.equal(clusterNameDescriptor(0).read(draft), "Shared Internal Services");
  assert.equal(clusterNameDescriptor(1).read(draft), "Third-Party Integrations");
});
