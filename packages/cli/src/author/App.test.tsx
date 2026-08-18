import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { App } from "./App.js";
import type { DraftIR } from "./draftIr.js";

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

async function typeAndSubmit(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  await type(stdin, text);
  await submit(stdin);
}

async function down(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write(DOWN_ARROW);
  await flushImmediate();
}
async function finishOneItemQuickly(stdin: { write: (data: string) => void }, title: string, hasPill = true): Promise<void> {
  await typeAndSubmit(stdin, title);
  if (hasPill) {
    await submit(stdin); // skip or accept the section's pill prompt
  }
  await submit(stdin); // no description lines
  await submit(stdin); // skip color
}

/** Drives the whole session from a fresh App all the way to Review,
 * taking the fastest path through every section, including the minimum
 * content now enforced by each required repeatable list.
 * Real content isn't the point here — App.tsx's own navigation wiring is. */
async function reachReview(stdin: { write: (data: string) => void }): Promise<void> {
  // intro: title, subtitle, deployedOn
  await typeAndSubmit(stdin, "Ticket Booking");
  await typeAndSubmit(stdin, "Online event ticketing");
  await typeAndSubmit(stdin, "AWS EKS");

  await finishOneItemQuickly(stdin, "Customer", false); // Inbound Actors has no pill prompt
  await submit(stdin); // end inbound actors after the required item

  // ingress: label, sublabel
  await typeAndSubmit(stdin, "API Gateway");
  await submit(stdin); // skip sublabel

  // corePlatform sub-layers: Discovery and Governance -> "Not sure yet"
  // (down, down, enter); Execution and Capability is mandatory (no decide
  // step) -> add its required item; Entity Layer -> "Not sure yet" again.
  await down(stdin);
  await down(stdin);
  await submit(stdin);
  await finishOneItemQuickly(stdin, "Booking Service");
  await submit(stdin); // end Execution and Capability after the required item
  await down(stdin);
  await down(stdin);
  await submit(stdin);

  await finishOneItemQuickly(stdin, "Booking Database");
  await submit(stdin); // end Systems of Record after the required item

  // egress: label, sublabel
  await typeAndSubmit(stdin, "Egress Proxy");
  await submit(stdin); // skip sublabel

  await typeAndSubmit(stdin, "Payment Providers");
  await finishOneItemQuickly(stdin, "Payment Gateway");
  await submit(stdin); // end this cluster's items
  await submit(stdin); // end External Systems after the required cluster

  await submit(stdin); // include the legend (the default)
}

test("reaching Review shows the values entered throughout the session", async () => {
  const { stdin, lastFrame, unmount } = render(<App onExit={() => {}} />);
  await reachReview(stdin);
  const frame = lastFrame();
  assert.ok(frame?.includes("Review"));
  assert.ok(frame?.includes("Ticket Booking"));
  assert.ok(frame?.includes("API Gateway"));
  assert.ok(frame?.includes("Egress Proxy"));
  assert.ok(frame?.includes("Legend"));
  assert.ok(frame?.includes("included"));
  unmount();
});

test("editing Title from Review re-enters IntroScreen pre-filled, and lands back on Review, not inboundActors", async () => {
  const { stdin, lastFrame, unmount } = render(<App onExit={() => {}} />);
  await reachReview(stdin);

  await down(stdin); // "Looks good" -> "Edit Title / Subtitle / Deployed On"
  await submit(stdin);

  // Back in IntroScreen, pre-filled with the real values already entered.
  assert.ok(lastFrame()?.includes("Ticket Booking"));
  await submit(stdin); // accept pre-filled title as-is
  assert.ok(lastFrame()?.includes("Online event ticketing"));
  await submit(stdin); // accept pre-filled subtitle as-is
  await submit(stdin); // accept pre-filled deployedOn as-is

  // Landed back on Review, not on inboundActors (which advance() would
  // have gone to from a plain "intro" completion).
  const frame = lastFrame();
  assert.ok(frame?.includes("Review"));
  assert.ok(!frame?.includes("Inbound Actor 1"));
  unmount();
});

test("Ctrl+C shows the cancelled message and calls onExit(null) exactly once", async () => {
  let exitCallCount = 0;
  let exitedWith: DraftIR | null | undefined;
  const { stdin, lastFrame, unmount } = render(
    <App onExit={(d) => { exitCallCount += 1; exitedWith = d; }} />
  );

  await type(stdin, "Partial Session");
  await submit(stdin);
  stdin.write("\x03");
  await flushImmediate();

  assert.ok(lastFrame()?.includes("Nothing was saved"));
  assert.equal(exitCallCount, 1);
  assert.equal(exitedWith, null);
  unmount();
});

test("confirming from Review moves past it, into the final validate/render/save step", async () => {
  let exited: DraftIR | null | undefined;
  const { stdin, lastFrame, unmount } = render(<App onExit={(d) => { exited = d; }} />);
  await reachReview(stdin);

  await submit(stdin); // "Looks good — continue", the first, already-highlighted option

  assert.ok(lastFrame()?.includes("Save"));
  assert.equal(exited, undefined);
  unmount();
});
