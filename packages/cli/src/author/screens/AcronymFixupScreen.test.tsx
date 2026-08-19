import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { AcronymFixupScreen } from "./AcronymFixupScreen.js";

async function typeAndSubmit(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  stdin.write(text);
  await flushImmediate();
  stdin.write("\r");
  await flushImmediate();
}

async function submit(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write("\r");
  await flushImmediate();
}

test("shows the first flagged title and a progress count", () => {
  const { lastFrame, unmount } = render(<AcronymFixupScreen titles={["A Very Long Title", "Another One"]} onComplete={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("A Very Long Title"));
  assert.ok(frame?.includes("(1/2)"));
  unmount();
});

test("submitting an acronym advances to the next title, not shown as still pending", async () => {
  const { stdin, lastFrame, unmount } = render(<AcronymFixupScreen titles={["First Title", "Second Title"]} onComplete={() => {}} />);
  await typeAndSubmit(stdin, "FT");
  const frame = lastFrame();
  assert.ok(frame?.includes("Second Title"));
  assert.ok(frame?.includes("(2/2)"));
  assert.ok(!frame?.includes("First Title"));
  unmount();
});

test("calls onComplete with every answer, in the same order as the titles, once the last one submits", async () => {
  const result: { answers: string[] | null } = { answers: null };
  const { stdin, unmount } = render(
    <AcronymFixupScreen titles={["First Title", "Second Title"]} onComplete={(answers) => { result.answers = answers; }} />
  );
  await typeAndSubmit(stdin, "FT");
  await typeAndSubmit(stdin, "ST");
  assert.deepEqual(result.answers, ["FT", "ST"]);
  unmount();
});

test("an empty submission (skip) still advances and is recorded as an empty answer", async () => {
  const result: { answers: string[] | null } = { answers: null };
  const { stdin, lastFrame, unmount } = render(
    <AcronymFixupScreen titles={["First Title", "Second Title"]} onComplete={(answers) => { result.answers = answers; }} />
  );
  await submit(stdin);
  assert.ok(lastFrame()?.includes("Second Title"));
  await submit(stdin);
  assert.deepEqual(result.answers, ["", ""]);
  unmount();
});

test("a single flagged title completes immediately after one submission", async () => {
  const result: { answers: string[] | null } = { answers: null };
  const { stdin, unmount } = render(
    <AcronymFixupScreen titles={["Only Title"]} onComplete={(answers) => { result.answers = answers; }} />
  );
  await typeAndSubmit(stdin, "OT");
  assert.deepEqual(result.answers, ["OT"]);
  unmount();
});
