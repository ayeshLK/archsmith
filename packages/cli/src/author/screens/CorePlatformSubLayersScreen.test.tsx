import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { CorePlatformSubLayersScreen } from "./CorePlatformSubLayersScreen.js";
import type { DraftIR } from "../draftIr.js";

const DOWN_ARROW = "[B";
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

/** Drives one item through ItemSubFlow's fastest path (title, then skip
 * everything else), mirroring InboundActorsScreen.test.tsx. */
async function finishOneItemQuickly(stdin: { write: (data: string) => void }, title: string): Promise<void> {
  await type(stdin, title);
  await submit(stdin); // title -> eyebrow
  await submit(stdin); // skip eyebrow
  await submit(stdin); // no description lines
  await submit(stdin); // "(skip)" color, already highlighted
}

/** Selects "Not sure yet — skip for now", the 3rd (last) decide option. */
async function selectPending(stdin: { write: (data: string) => void }): Promise<void> {
  await down(stdin);
  await down(stdin);
  await submit(stdin);
}

/** Selects "No — doesn't apply to this diagram", the 2nd decide option. */
async function selectAbsent(stdin: { write: (data: string) => void }): Promise<void> {
  await down(stdin);
  await submit(stdin);
}

test("shows the first governed sub-layer's label and authoring hint before anything is selected", () => {
  const { lastFrame, unmount } = render(<CorePlatformSubLayersScreen draft={{}} onComplete={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("Discovery and Governance"));
  assert.ok(frame?.includes("Infrastructure-level concerns"));
  unmount();
});

test("selecting \"Not sure yet\" for all 3 layers advances through each and completes with no subLayers or gap notes", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, lastFrame, unmount } = render(
    <CorePlatformSubLayersScreen draft={{}} onComplete={(d) => { result.completed = d; }} />
  );

  await selectPending(stdin);
  assert.ok(lastFrame()?.includes("Execution and Capability"));
  await selectPending(stdin);
  assert.ok(lastFrame()?.includes("Entity Layer"));
  await selectPending(stdin);

  assert.equal(result.completed?.columns?.corePlatform?.subLayers, undefined);
  assert.equal(result.completed?.unclassified, undefined);
  unmount();
});

test("selecting \"No\" walks through a title and description, then records a gap note and advances", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, lastFrame, unmount } = render(
    <CorePlatformSubLayersScreen draft={{}} onComplete={(d) => { result.completed = d; }} />
  );

  await selectAbsent(stdin);
  assert.ok(lastFrame()?.includes("short title for this gap note"));
  await type(stdin, "No Governance Layer");
  await submit(stdin);
  assert.ok(lastFrame()?.includes("explaining why"));
  await type(stdin, "This system has no separate governance layer.");
  await submit(stdin);

  // advanced to the next layer
  assert.ok(lastFrame()?.includes("Execution and Capability"));
  await selectPending(stdin);
  await selectPending(stdin);

  assert.deepEqual(result.completed?.unclassified, [
    {
      title: "No Governance Layer",
      description: "This system has no separate governance layer.",
      reason: "missing-layer",
      location: "discovery-and-governance",
    },
  ]);
  unmount();
});

test("selecting \"Yes\" adds items via the shared ItemSubFlow, ending the layer's list on an empty title", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, lastFrame, unmount } = render(
    <CorePlatformSubLayersScreen draft={{}} onComplete={(d) => { result.completed = d; }} />
  );

  await submit(stdin); // "Yes" is the first, already-highlighted option
  assert.ok(lastFrame()?.includes("item 1"));
  await finishOneItemQuickly(stdin, "API Gateway Policy");
  assert.ok(lastFrame()?.includes("item 2"));
  await submit(stdin); // empty title ends this layer's list

  assert.ok(lastFrame()?.includes("Execution and Capability"));
  await selectPending(stdin);
  await selectPending(stdin);

  const subLayers = result.completed?.columns?.corePlatform?.subLayers;
  assert.equal(subLayers?.length, 1);
  assert.equal(subLayers?.[0]?.registryId, "discovery-and-governance");
  assert.deepEqual(subLayers?.[0]?.rows.flat().map((i) => i.title), ["API Gateway Policy"]);
  unmount();
});

test("finishing a layer with 3 items re-groups them into real columns (2-1), not a one-item-per-row stack (issue #88)", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, unmount } = render(
    <CorePlatformSubLayersScreen draft={{}} onComplete={(d) => { result.completed = d; }} />
  );

  await submit(stdin); // "Yes" for Discovery and Governance
  await finishOneItemQuickly(stdin, "API Gateway Policy");
  await finishOneItemQuickly(stdin, "Rate Limiting");
  await finishOneItemQuickly(stdin, "Access Control");
  await submit(stdin); // empty title ends this layer's list

  await selectPending(stdin); // Execution and Capability
  await selectPending(stdin); // Entity Layer

  const rows = result.completed?.columns?.corePlatform?.subLayers?.[0]?.rows;
  assert.deepEqual(
    rows?.map((r) => r.map((i) => i.title)),
    [["API Gateway Policy", "Rate Limiting"], ["Access Control"]]
  );
  unmount();
});

test("calls onComplete once, only after all 3 governed sub-layers have been decided", async () => {
  let completeCallCount = 0;
  const { stdin, unmount } = render(
    <CorePlatformSubLayersScreen draft={{}} onComplete={() => { completeCallCount += 1; }} />
  );

  await selectPending(stdin);
  assert.equal(completeCallCount, 0);
  await selectPending(stdin);
  assert.equal(completeCallCount, 0);
  await selectPending(stdin);
  assert.equal(completeCallCount, 1);
  unmount();
});
