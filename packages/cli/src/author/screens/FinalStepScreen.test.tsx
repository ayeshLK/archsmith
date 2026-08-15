import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import React from "react";
import { render } from "ink-testing-library";
import { FinalStepScreen } from "./FinalStepScreen.js";
import type { DraftIR } from "../draftIr.js";

const DOWN_ARROW = String.fromCharCode(27) + "[B";
const ENTER = "\r";

async function submit(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write(ENTER);
  await flushImmediate();
}

async function down(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write(DOWN_ARROW);
  await flushImmediate();
}

async function withTempDir<T>(fn: (dir: string) => Promise<T> | T): Promise<T> {
  const dir = mkdtempSync(path.join(tmpdir(), "archsmith-author-test-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const VALID_DRAFT: DraftIR = {
  title: "Ticket Booking",
  subtitle: "Online ticketing",
  columns: {
    inboundActors: { items: [{ title: "Web App" }] },
    ingress: { gateway: { label: "API Gateway" } },
    corePlatform: {
      deployedOn: "AWS EKS",
      subLayers: [{ registryId: "execution-and-capability", rows: [[{ title: "Booking Service" }]] }],
      systemsOfRecord: { registryId: "systems-of-record", items: [{ title: "Booking Database" }] },
    },
    egress: { gateway: { label: "Egress Proxy" } },
    externalSystems: { clusters: [{ name: "Payments", items: [{ title: "Payment Gateway" }] }] },
  },
};

test("shows the Save prompt with a slugified default name derived from the title", async () => {
  await withTempDir((dir) => {
    const { lastFrame, unmount } = render(<FinalStepScreen draft={VALID_DRAFT} onExit={() => {}} cwd={dir} />);
    const frame = lastFrame();
    assert.ok(frame?.includes("Save"));
    assert.ok(frame?.includes("ticket-booking"));
    unmount();
  });
});

test("submitting with no existing files writes both files and shows their real paths", async () => {
  await withTempDir(async (dir) => {
    let exited: DraftIR | null = null;
    const { stdin, lastFrame, unmount } = render(
      <FinalStepScreen draft={VALID_DRAFT} onExit={(d) => { exited = d; }} cwd={dir} />
    );

    await submit(stdin); // accept the default slugified name

    const irPath = path.join(dir, "ticket-booking.archsmith.json");
    const svgPath = path.join(dir, "ticket-booking.svg");
    assert.ok(existsSync(irPath));
    assert.ok(existsSync(svgPath));

    // Whitespace stripped before matching — a long temp-dir path gets
    // soft-wrapped across lines (sometimes mid-word) by Ink's own
    // terminal-width rendering, which would otherwise break a literal
    // substring match at an arbitrary point.
    const flatFrame = lastFrame()?.replace(/\s+/g, "");
    assert.ok(flatFrame?.includes("Saved."));
    assert.ok(flatFrame?.includes("ticket-booking.archsmith.json"));
    assert.ok(flatFrame?.includes("ticket-booking.svg"));
    assert.equal(exited, VALID_DRAFT);

    const savedIr = JSON.parse(readFileSync(irPath, "utf-8"));
    assert.equal(savedIr.title, "Ticket Booking");
    const savedSvg = readFileSync(svgPath, "utf-8");
    assert.ok(savedSvg.includes("<svg"));
    unmount();
  });
});

test("an existing file at the target path prompts to overwrite or rename, rather than silently clobbering it", async () => {
  await withTempDir(async (dir) => {
    const irPath = path.join(dir, "ticket-booking.archsmith.json");
    writeFileSync(irPath, "pre-existing content", "utf-8");

    const { stdin, lastFrame, unmount } = render(<FinalStepScreen draft={VALID_DRAFT} onExit={() => {}} cwd={dir} />);
    await submit(stdin); // accept the default name, which now collides

    assert.ok(lastFrame()?.includes("already exists"));
    assert.equal(readFileSync(irPath, "utf-8"), "pre-existing content"); // untouched so far

    await down(stdin); // "Overwrite" -> "Choose a different name"
    await submit(stdin);
    assert.ok(lastFrame()?.includes("Save")); // back at the name prompt
    assert.equal(readFileSync(irPath, "utf-8"), "pre-existing content"); // still untouched
    unmount();
  });
});

test("choosing to overwrite proceeds with the save", async () => {
  await withTempDir(async (dir) => {
    const irPath = path.join(dir, "ticket-booking.archsmith.json");
    writeFileSync(irPath, "pre-existing content", "utf-8");

    const { stdin, lastFrame, unmount } = render(<FinalStepScreen draft={VALID_DRAFT} onExit={() => {}} cwd={dir} />);
    await submit(stdin); // name collides
    await submit(stdin); // "Overwrite" is the first, already-highlighted option

    assert.ok(lastFrame()?.includes("Saved."));
    const saved = JSON.parse(readFileSync(irPath, "utf-8"));
    assert.equal(saved.title, "Ticket Booking");
    unmount();
  });
});

test("an incomplete draft shows the assemble() error plainly and writes nothing", async () => {
  await withTempDir((dir) => {
    const { lastFrame, unmount } = render(<FinalStepScreen draft={{}} onExit={() => {}} cwd={dir} />);
    const frame = lastFrame();
    assert.ok(frame?.includes("Can't finish yet"));
    assert.ok(frame?.includes("title"));
    assert.ok(frame?.includes("Nothing has been saved"));
    unmount();
  });
});

test("a draft with an empty required repeatable list shows validate()'s real errors, not a generic message", async () => {
  await withTempDir((dir) => {
    const invalid: DraftIR = { ...VALID_DRAFT, columns: { ...VALID_DRAFT.columns, inboundActors: { items: [] } } };
    const { lastFrame, unmount } = render(<FinalStepScreen draft={invalid} onExit={() => {}} cwd={dir} />);
    const frame = lastFrame();
    assert.ok(frame?.includes("Can't finish yet"));
    assert.ok(frame?.includes("inboundActors"));
    unmount();
  });
});

test("flags any Core Platform sub-layer still pending in the completion summary", async () => {
  await withTempDir(async (dir) => {
    const { stdin, lastFrame, unmount } = render(<FinalStepScreen draft={VALID_DRAFT} onExit={() => {}} cwd={dir} />);
    await submit(stdin);
    // VALID_DRAFT only resolves execution-and-capability; discovery-and-governance
    // and entity-layer were never touched, so both are pending.
    const frame = lastFrame();
    assert.ok(frame?.includes("still pending"));
    assert.ok(frame?.includes("Discovery and Governance"));
    assert.ok(frame?.includes("Entity Layer"));
    unmount();
  });
});
