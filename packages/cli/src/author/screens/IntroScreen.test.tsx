import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { IntroScreen } from "./IntroScreen.js";
import type { DraftIR } from "../draftIr.js";

/** Simulates typing `text` then pressing Enter, exactly as a real
 * interactive session would drive ink-text-input — this is the real
 * input-handling loop, not a mocked shortcut. Awaits a tick after each
 * write so React's state update actually flushes before the next one is
 * sent — without this, rapid-fire synchronous writes race ahead of the
 * component's own re-render. */
async function typeAndSubmit(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  stdin.write(text);
  await flushImmediate();
  stdin.write("\r");
  await flushImmediate();
}

/** Submits whatever value is already showing, without typing anything new
 * first — for asserting a pre-filled default is accepted as-is. */
async function submit(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write("\r");
  await flushImmediate();
}

test("shows the first field's label and hint before anything is typed", () => {
  const { lastFrame, unmount } = render(<IntroScreen draft={{}} onComplete={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("Title"));
  assert.ok(frame?.includes("diagram's title"));
  unmount();
});

test("typing and submitting the title advances to the subtitle field", async () => {
  const { stdin, lastFrame, unmount } = render(<IntroScreen draft={{}} onComplete={() => {}} />);
  await typeAndSubmit(stdin, "My Diagram");
  const frame = lastFrame();
  assert.ok(frame?.includes("Subtitle"));
  assert.ok(!frame?.includes("My Diagram")); // that field's own value isn't shown once we've moved on
  unmount();
});

test("submitting all three fields in order calls onComplete with a fully-populated draft", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, unmount } = render(
    <IntroScreen draft={{}} onComplete={(draft) => { result.completed = draft; }} />
  );

  await typeAndSubmit(stdin, "My Diagram — Architecture");
  await typeAndSubmit(stdin, "A real interactive test");
  await typeAndSubmit(stdin, "AWS EKS");

  assert.deepEqual(result.completed, {
    title: "My Diagram — Architecture",
    subtitle: "A real interactive test",
    columns: { corePlatform: { deployedOn: "AWS EKS" } },
  });
  unmount();
});

test("each required text field refuses an empty submission and stays on that field", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, lastFrame, unmount } = render(
    <IntroScreen draft={{}} onComplete={(draft) => { result.completed = draft; }} />
  );

  await submit(stdin);
  assert.ok(lastFrame()?.includes("Can't finish yet — Title is required."));

  await typeAndSubmit(stdin, "My Diagram");
  await submit(stdin);
  assert.ok(lastFrame()?.includes("Can't finish yet — Subtitle is required."));

  await typeAndSubmit(stdin, "A subtitle");
  await submit(stdin);
  assert.ok(lastFrame()?.includes("Can't finish yet — Deployed on is required."));

  await typeAndSubmit(stdin, "AWS EKS");
  assert.equal(result.completed?.title, "My Diagram");
  unmount();
});

test("re-entering with an already-populated draft pre-fills each field's existing value, not blank", async () => {
  const existing: DraftIR = { title: "Original Title", subtitle: "Original Subtitle" };
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, lastFrame, unmount } = render(
    <IntroScreen draft={existing} onComplete={(draft) => { result.completed = draft; }} />
  );

  assert.ok(lastFrame()?.includes("Original Title"));
  await submit(stdin); // accept the pre-filled title as-is, unchanged
  assert.ok(lastFrame()?.includes("Original Subtitle"));
  await submit(stdin); // accept the pre-filled subtitle as-is, unchanged
  await typeAndSubmit(stdin, "AWS EKS");

  assert.equal(result.completed?.title, "Original Title");
  assert.equal(result.completed?.subtitle, "Original Subtitle");
  unmount();
});
