import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { InboundActorsScreen } from "./InboundActorsScreen.js";
import type { DraftIR } from "../draftIr.js";

async function type(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  stdin.write(text);
  await flushImmediate();
}

async function submit(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write("\r");
  await flushImmediate();
}

/** Drives one item's title -> (no description lines) -> (skip color)
 * through to completion, the fastest path through ItemSubFlow, so this
 * test can focus on the outer repeatable-list mechanics rather than
 * re-testing ItemSubFlow's own fields. Inbound Actors has neither a pill
 * step (pillMode "none" — actorBox has no pill support) nor an eyebrow
 * step (eyebrowEnabled false), so title goes straight to description. */
async function finishOneItemQuickly(stdin: { write: (data: string) => void }, title: string): Promise<void> {
  await type(stdin, title);
  await submit(stdin); // title -> descriptionLines
  await submit(stdin); // no description lines -> dotColor
  await submit(stdin); // "(skip)" color, already highlighted
}

test("adding two actors, then an empty title, ends the list with both preserved", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(
    <InboundActorsScreen draft={{}} onComplete={(d) => { result.draft = d; }} />
  );

  await finishOneItemQuickly(stdin, "Employee Web App");
  await finishOneItemQuickly(stdin, "Support Portal");
  await submit(stdin); // empty title on item 3 -> ends the list

  const items = result.draft?.columns?.inboundActors?.items;
  assert.equal(items?.length, 2);
  assert.equal(items?.[0]?.title, "Employee Web App");
  assert.equal(items?.[1]?.title, "Support Portal");
  unmount();
});

test("an empty title on the very first item ends the list with zero items — validate() catches that, not this screen", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(
    <InboundActorsScreen draft={{}} onComplete={(d) => { result.draft = d; }} />
  );

  await submit(stdin);

  assert.equal(result.draft?.columns?.inboundActors?.items, undefined);
  unmount();
});

test("shows the current item number, incrementing as items are added", async () => {
  const { stdin, lastFrame, unmount } = render(<InboundActorsScreen draft={{}} onComplete={() => {}} />);
  assert.ok(lastFrame()?.includes("Inbound Actor 1"));
  await finishOneItemQuickly(stdin, "Employee Web App");
  assert.ok(lastFrame()?.includes("Inbound Actor 2"));
  unmount();
});
