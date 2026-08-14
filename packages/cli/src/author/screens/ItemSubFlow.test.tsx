import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { ItemSubFlow } from "./ItemSubFlow.js";
import { itemLens, inboundActorsAccessor } from "../itemLens.js";
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

test("a full walk through all 4 fields (title, eyebrow skipped, one description line, a color) completes with the right draft", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(
    <ItemSubFlow draft={{}} lens={freshLens()} onEmptyTitle={() => {}} onComplete={(d) => { result.draft = d; }} />
  );

  await type(stdin, "Employee Web App");
  await submit(stdin); // title -> eyebrow

  await submit(stdin); // skip eyebrow (empty) -> descriptionLines

  await type(stdin, "React SPA — internal staff");
  await submit(stdin); // one description line
  await submit(stdin); // empty -> finish description lines, -> dotColor

  // dotColor: items are [(skip), purple, green, teal, amber, navy, mint] —
  // move down twice to land on "green", then select it.
  stdin.write(DOWN_ARROW);
  await flushImmediate();
  stdin.write(DOWN_ARROW);
  await flushImmediate();
  await submit(stdin);

  const item = result.draft?.columns?.inboundActors?.items?.[0];
  assert.equal(item?.title, "Employee Web App");
  assert.equal(item?.eyebrow, null);
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
  await submit(stdin);
  await submit(stdin); // skip eyebrow
  await submit(stdin); // no description lines
  await submit(stdin); // "(skip)" is the first, already-highlighted color option

  const item = result.draft?.columns?.inboundActors?.items?.[0];
  assert.equal(item?.dotColor, null);
  unmount();
});
