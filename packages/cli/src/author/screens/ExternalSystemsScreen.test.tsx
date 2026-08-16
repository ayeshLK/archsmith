import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { ExternalSystemsScreen } from "./ExternalSystemsScreen.js";
import type { DraftIR } from "../draftIr.js";

async function type(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  stdin.write(text);
  await flushImmediate();
}

async function submit(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write("\r");
  await flushImmediate();
}

/** Types a cluster name and submits it, moving from the clusterName phase
 * into that cluster's items phase. */
async function typeClusterName(stdin: { write: (data: string) => void }, name: string): Promise<void> {
  await type(stdin, name);
  await submit(stdin);
}

/** Drives one item through ItemSubFlow's fastest path, matching the
 * pattern already used in InboundActorsScreen.test.tsx. External Systems'
 * pill step is a yes/no (pillMode "viaEgressOnly"), "Yes" pre-highlighted —
 * a blind submit here accepts it, same as the already-highlighted "(skip)"
 * color option below, so every item finished this way ends up tagged
 * { label: "via egress", semantic: "viaEgress" }. There's no eyebrow step
 * for this section (eyebrowEnabled false). */
async function finishOneItemQuickly(stdin: { write: (data: string) => void }, title: string): Promise<void> {
  await type(stdin, title);
  await submit(stdin); // title -> pill (yes/no, "Yes" already highlighted)
  await submit(stdin); // accept "Yes" -> tagged via egress -> descriptionLines
  await submit(stdin); // no description lines -> dotColor
  await submit(stdin); // "(skip)" color, already highlighted
}

test("shows the first cluster's prompt and hint before anything is typed", () => {
  const { lastFrame, unmount } = render(<ExternalSystemsScreen draft={{}} onComplete={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("External Systems — Cluster 1"));
  assert.ok(frame?.includes("short name for this group"));
  unmount();
});

test("submitting a cluster name advances into that cluster's item list", async () => {
  const { stdin, lastFrame, unmount } = render(<ExternalSystemsScreen draft={{}} onComplete={() => {}} />);
  await typeClusterName(stdin, "Shared Internal Services");
  assert.ok(lastFrame()?.includes("Cluster 1 — item 1"));
  unmount();
});

test("an empty cluster name on the very first cluster ends with zero clusters — validate() catches that, not this screen", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(<ExternalSystemsScreen draft={{}} onComplete={(d) => { result.draft = d; }} />);
  await submit(stdin);
  assert.equal(result.draft?.columns?.externalSystems, undefined);
  unmount();
});

test("an empty title on a cluster's first item advances to the next cluster's name prompt", async () => {
  const { stdin, lastFrame, unmount } = render(<ExternalSystemsScreen draft={{}} onComplete={() => {}} />);
  await typeClusterName(stdin, "Shared Internal Services");
  await submit(stdin); // empty title ends this cluster's item list
  assert.ok(lastFrame()?.includes("External Systems — Cluster 2"));
  unmount();
});

test("a full two-cluster walkthrough assembles the expected clusters, names, and items", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(<ExternalSystemsScreen draft={{}} onComplete={(d) => { result.draft = d; }} />);

  await typeClusterName(stdin, "Shared Internal Services");
  await finishOneItemQuickly(stdin, "Notification Delivery Service");
  await submit(stdin); // empty title ends cluster 1's items

  await typeClusterName(stdin, "Third-Party Integrations");
  await finishOneItemQuickly(stdin, "Payment Gateway");
  await finishOneItemQuickly(stdin, "Tax Calculation Service");
  await submit(stdin); // empty title ends cluster 2's items

  await submit(stdin); // empty cluster name ends the whole section

  const clusters = result.draft?.columns?.externalSystems?.clusters;
  assert.equal(clusters?.length, 2);
  assert.equal(clusters?.[0]?.name, "Shared Internal Services");
  assert.deepEqual(clusters?.[0]?.items.map((i) => i.title), ["Notification Delivery Service"]);
  assert.equal(clusters?.[1]?.name, "Third-Party Integrations");
  assert.deepEqual(clusters?.[1]?.items.map((i) => i.title), ["Payment Gateway", "Tax Calculation Service"]);
  unmount();
});

test("an empty cluster name after a real cluster preserves it, ending the section there", async () => {
  const result: { draft: DraftIR | null } = { draft: null };
  const { stdin, unmount } = render(<ExternalSystemsScreen draft={{}} onComplete={(d) => { result.draft = d; }} />);

  await typeClusterName(stdin, "Shared Internal Services");
  await finishOneItemQuickly(stdin, "Notification Delivery Service");
  await submit(stdin); // empty title ends cluster 1's items
  await submit(stdin); // empty cluster name ends the section here

  const clusters = result.draft?.columns?.externalSystems?.clusters;
  assert.equal(clusters?.length, 1);
  assert.equal(clusters?.[0]?.name, "Shared Internal Services");
  unmount();
});
