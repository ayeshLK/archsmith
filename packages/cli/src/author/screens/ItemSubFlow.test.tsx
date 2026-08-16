import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { ItemSubFlow } from "./ItemSubFlow.js";
import { itemLens, inboundActorsAccessor, systemsOfRecordAccessor, clusterItemsAccessor, subLayerItemsAccessor } from "../itemLens.js";
import type { DraftIR } from "../draftIr.js";

const DOWN_ARROW = String.fromCharCode(27) + "[B";
const ENTER = "\r";

async function type(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  stdin.write(text);
  await flushImmediate();
}

async function submit(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write(ENTER);
  await flushImmediate();
}

async function down(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write(DOWN_ARROW);
  await flushImmediate();
}

function freshLens() {
  return itemLens("test.0", inboundActorsAccessor(), 0);
}

test("submitting an empty title calls onEmptyTitle, not onComplete", async () => {
  let emptyTitleCalled = false;
  const { stdin, unmount } = render(
    <ItemSubFlow draft={{}} lens={freshLens()} onEmptyTitle={() => { emptyTitleCalled = true; }} onComplete={() => {}} />
  );
  await submit(stdin);
  assert.ok(emptyTitleCalled);
  unmount();
});

test("Inbound Actors (pillMode \"none\", eyebrow disabled): title -> description -> color, no pill or eyebrow step at all", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(
    <ItemSubFlow draft={{}} lens={freshLens()} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Employee Web App");
  await submit(stdin); // title -> descriptionLines directly (no pill step for this accessor)

  await type(stdin, "React SPA — internal staff");
  await submit(stdin); // one description line
  await submit(stdin); // empty -> finish description lines -> dotColor directly (no eyebrow step)

  // dotColor: items are [(skip), purple, green, teal, amber, navy, mint] —
  // move down twice to land on "green", then select it.
  await down(stdin);
  await down(stdin);
  await submit(stdin);

  const item = result.draft?.columns?.inboundActors?.items?.[0];
  assert.equal(item?.title, "Employee Web App");
  assert.equal(item?.eyebrow, undefined); // step never shown, never written
  assert.equal(item?.pill, undefined); // step never shown, never written
  assert.deepEqual(item?.descriptionLines, ["React SPA — internal staff"]);
  assert.equal(item?.dotColor, "green");
  unmount();
});

test("selecting \"(skip)\" for color writes null, not a string", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(
    <ItemSubFlow draft={{}} lens={freshLens()} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Support Portal");
  await submit(stdin); // title -> descriptionLines
  await submit(stdin); // no description lines
  await submit(stdin); // "(skip)" is the first, already-highlighted color option

  const item = result.draft?.columns?.inboundActors?.items?.[0];
  assert.equal(item?.dotColor, null);
  unmount();
});

test("Systems of Record (pillMode \"full\"): typing a label then picking a semantic writes the real PillIR", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const lens = itemLens("sor.0", systemsOfRecordAccessor(), 0);
  const { stdin, lastFrame, unmount } = render(
    <ItemSubFlow draft={{}} lens={lens} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Booking Database");
  await submit(stdin); // title -> pill (full: label first)

  assert.ok(lastFrame()?.includes("Pill"));
  await type(stdin, "PRIMARY");
  await submit(stdin); // label -> semantic picker

  assert.ok(lastFrame()?.includes("PRIMARY"));
  await submit(stdin); // "Primary" is first, already-highlighted

  await submit(stdin); // skip description
  await submit(stdin); // skip color (eyebrow disabled for Systems of Record)

  const item = result.draft?.columns?.corePlatform?.systemsOfRecord?.items?.[0];
  assert.deepEqual(item?.pill, { label: "PRIMARY", semantic: "primary" });
  unmount();
});

test("Systems of Record: an empty pill label skips the pill entirely — writes null, never reaches the semantic picker", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const lens = itemLens("sor.0", systemsOfRecordAccessor(), 0);
  const { stdin, lastFrame, unmount } = render(
    <ItemSubFlow draft={{}} lens={lens} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Booking Database");
  await submit(stdin); // title -> pill
  await submit(stdin); // empty label -> skip -> descriptionLines directly

  assert.ok(lastFrame()?.includes("Description"));
  await submit(stdin); // skip description
  await submit(stdin); // skip color

  const item = result.draft?.columns?.corePlatform?.systemsOfRecord?.items?.[0];
  assert.equal(item?.pill, null);
  unmount();
});

test("External Systems (pillMode \"viaEgressOnly\"): \"Yes\" writes the fixed via-egress pill, no text entry", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const lens = itemLens("cluster.0.0", clusterItemsAccessor(0), 0);
  const { stdin, lastFrame, unmount } = render(
    <ItemSubFlow draft={{}} lens={lens} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Payment Gateway");
  await submit(stdin); // title -> pill (viaEgressOnly: yes/no, no text entry)

  assert.ok(lastFrame()?.includes("Egress"));
  await submit(stdin); // "Yes" is first, already-highlighted

  await submit(stdin); // skip description
  await submit(stdin); // skip color

  const item = result.draft?.columns?.externalSystems?.clusters?.[0]?.items?.[0];
  assert.deepEqual(item?.pill, { label: "via egress", semantic: "viaEgress" });
  unmount();
});

test("External Systems: \"No pill\" writes null", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const lens = itemLens("cluster.0.0", clusterItemsAccessor(0), 0);
  const { stdin, unmount } = render(
    <ItemSubFlow draft={{}} lens={lens} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Payment Gateway");
  await submit(stdin); // title -> pill
  await down(stdin); // "Yes" -> "No pill"
  await submit(stdin);

  await submit(stdin); // skip description
  await submit(stdin); // skip color

  const item = result.draft?.columns?.externalSystems?.clusters?.[0]?.items?.[0];
  assert.equal(item?.pill, null);
  unmount();
});

test("Core Platform / discovery-and-governance (eyebrowEnabled true): eyebrow step appears after description", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const lens = itemLens("core.0.0", subLayerItemsAccessor(0, "discovery-and-governance"), 0);
  const { stdin, lastFrame, unmount } = render(
    <ItemSubFlow draft={{}} lens={lens} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Access Review Service");
  await submit(stdin); // title -> pill (full)
  await submit(stdin); // skip pill
  await submit(stdin); // skip description -> eyebrow (enabled for this sub-layer)

  assert.ok(lastFrame()?.includes("Category"));
  await type(stdin, "Identity");
  await submit(stdin); // -> dotColor
  await submit(stdin); // skip color

  const item = result.draft?.columns?.corePlatform?.subLayers?.[0]?.rows.flat()[0];
  assert.equal(item?.eyebrow, "Identity");
  unmount();
});

test("Core Platform / execution-and-capability (eyebrowEnabled false): description skips straight to color, no eyebrow step", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const lens = itemLens("core.0.0", subLayerItemsAccessor(0, "execution-and-capability"), 0);
  const { stdin, lastFrame, unmount } = render(
    <ItemSubFlow draft={{}} lens={lens} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Booking Service");
  await submit(stdin); // title -> pill (full)
  await submit(stdin); // skip pill
  await submit(stdin); // skip description -> dotColor directly

  assert.ok(lastFrame()?.includes("Color accent"));
  assert.ok(!lastFrame()?.includes("Category"));
  await submit(stdin); // skip color

  const item = result.draft?.columns?.corePlatform?.subLayers?.[0]?.rows.flat()[0];
  assert.equal(item?.eyebrow, undefined);
  unmount();
});
