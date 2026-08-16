import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { SystemsOfRecordScreen } from "./SystemsOfRecordScreen.js";
import type { DraftIR } from "../draftIr.js";

async function type(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  stdin.write(text);
  await flushImmediate();
}

async function submit(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write("\r");
  await flushImmediate();
}

/** Systems of Record has a pill step (pillMode "full") but no eyebrow step
 * (eyebrowEnabled false) — an empty pill label skips it same as eyebrow
 * used to. */
async function finishOneItemQuickly(stdin: { write: (data: string) => void }, title: string): Promise<void> {
  await type(stdin, title);
  await submit(stdin); // title -> pill
  await submit(stdin); // skip pill (empty label)
  await submit(stdin); // no description lines -> dotColor
  await submit(stdin); // "(skip)" color, already highlighted
}

test("adding two systems of record, then an empty title, ends the list with both preserved", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(
    <SystemsOfRecordScreen draft={{}} onComplete={(d) => { result.draft = d; }} />
  );

  await finishOneItemQuickly(stdin, "Primary Order Database");
  await finishOneItemQuickly(stdin, "Customer Master Data Store");
  await submit(stdin); // empty title on item 3 -> ends the list

  const items = result.draft?.columns?.corePlatform?.systemsOfRecord?.items;
  assert.equal(items?.length, 2);
  assert.equal(items?.[0]?.title, "Primary Order Database");
  assert.equal(items?.[1]?.title, "Customer Master Data Store");
  unmount();
});

test("the systemsOfRecord section is seeded with the fixed registryId, not left empty", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(
    <SystemsOfRecordScreen draft={{}} onComplete={(d) => { result.draft = d; }} />
  );

  await finishOneItemQuickly(stdin, "Primary Order Database");
  await submit(stdin); // empty title ends the list

  assert.equal(result.draft?.columns?.corePlatform?.systemsOfRecord?.registryId, "systems-of-record");
  unmount();
});

test("an empty title on the very first item ends the list with zero items — validate() catches that, not this screen", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(
    <SystemsOfRecordScreen draft={{}} onComplete={(d) => { result.draft = d; }} />
  );

  await submit(stdin);

  assert.equal(result.draft?.columns?.corePlatform?.systemsOfRecord, undefined);
  unmount();
});

test("shows the current item number, incrementing as items are added", async () => {
  const { stdin, lastFrame, unmount } = render(<SystemsOfRecordScreen draft={{}} onComplete={() => {}} />);
  assert.ok(lastFrame()?.includes("Systems of Record 1"));
  await finishOneItemQuickly(stdin, "Primary Order Database");
  assert.ok(lastFrame()?.includes("Systems of Record 2"));
  unmount();
});
