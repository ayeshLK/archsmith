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

test("an empty submission still advances — validating emptiness is assemble()'s job, not this screen's", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, unmount } = render(
    <IntroScreen draft={{}} onComplete={(draft) => { result.completed = draft; }} />
  );

  await typeAndSubmit(stdin, ""); // empty title
  await typeAndSubmit(stdin, "S");
  await typeAndSubmit(stdin, "D");

  assert.equal(result.completed?.title, "");
  unmount();
});
