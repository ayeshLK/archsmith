import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import type { DraftIR } from "../draftIr.js";
import { LegendScreen } from "./LegendScreen.js";

const DOWN_ARROW = String.fromCharCode(27) + "[B";

test("defaults to including the legend and records that choice", async () => {
  let completed: DraftIR | undefined;
  const { stdin, lastFrame, unmount } = render(<LegendScreen draft={{ title: "Diagram" }} onComplete={(draft) => { completed = draft; }} />);

  assert.ok(lastFrame()?.includes("Include legend"));
  stdin.write("\r");
  await flushImmediate();

  assert.equal(completed?.includeLegend, true);
  assert.equal(completed?.title, "Diagram");
  unmount();
});

test("can omit the legend and seeds that answer when re-entered", async () => {
  let completed: DraftIR | undefined;
  const { stdin, lastFrame, unmount } = render(
    <LegendScreen draft={{ includeLegend: false }} onComplete={(draft) => { completed = draft; }} />
  );

  assert.ok(lastFrame()?.includes("Omit legend"));
  stdin.write("\r");
  await flushImmediate();
  assert.equal(completed?.includeLegend, false);
  unmount();
});

test("selecting Omit legend records false", async () => {
  let completed: DraftIR | undefined;
  const { stdin, unmount } = render(<LegendScreen draft={{}} onComplete={(draft) => { completed = draft; }} />);

  stdin.write(DOWN_ARROW);
  await flushImmediate();
  stdin.write("\r");
  await flushImmediate();

  assert.equal(completed?.includeLegend, false);
  unmount();
});
