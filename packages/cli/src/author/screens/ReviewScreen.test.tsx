import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { ReviewScreen } from "./ReviewScreen.js";
import { resolveSubLayerAsAbsent } from "../gapResolution.js";
import type { DraftIR } from "../draftIr.js";
import type { SectionId } from "../navigation.js";

const DOWN_ARROW = "[B";
const ENTER = "\r";

async function down(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write(DOWN_ARROW);
  await flushImmediate();
}

async function submit(stdin: { write: (data: string) => void }): Promise<void> {
  stdin.write(ENTER);
  await flushImmediate();
}

const FULL_DRAFT: DraftIR = {
  title: "Ticket Booking",
  subtitle: "Online event ticketing platform",
  columns: {
    inboundActors: { items: [{ title: "Web App" }, { title: "Mobile App" }] },
    ingress: { gateway: { label: "API Gateway", sublabel: "Kong" } },
    corePlatform: {
      deployedOn: "AWS EKS",
      subLayers: [{ registryId: "execution-and-capability", rows: [[{ title: "Booking Service" }]] }],
      systemsOfRecord: { registryId: "systems-of-record", items: [{ title: "Booking Database" }] },
    },
    egress: { gateway: { label: "Egress Proxy", sublabel: null } },
    externalSystems: { clusters: [{ name: "Payments", items: [{ title: "Payment Gateway" }] }] },
  },
  includeLegend: true,
};

test("shows every section's real values, not raw JSON", () => {
  const { lastFrame, unmount } = render(<ReviewScreen draft={FULL_DRAFT} onConfirm={() => {}} onEditSection={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("Ticket Booking"));
  assert.ok(frame?.includes("Online event ticketing platform"));
  assert.ok(frame?.includes("AWS EKS"));
  assert.ok(frame?.includes("Web App"));
  assert.ok(frame?.includes("Mobile App"));
  assert.ok(frame?.includes("API Gateway (Kong)"));
  assert.ok(frame?.includes("Booking Service"));
  assert.ok(frame?.includes("Booking Database"));
  assert.ok(frame?.includes("Egress Proxy")); // no sublabel -> no parenthetical
  assert.ok(!frame?.includes("Egress Proxy ("));
  assert.ok(frame?.includes("Payments"));
  assert.ok(frame?.includes("Payment Gateway"));
  assert.ok(frame?.includes("Legend"));
  assert.ok(frame?.includes("included"));
  unmount();
});

test("shows (not set) / (none yet) placeholders for an empty draft, not blank lines", () => {
  const { lastFrame, unmount } = render(<ReviewScreen draft={{}} onConfirm={() => {}} onEditSection={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("(not set)"));
  assert.ok(frame?.includes("(none yet)"));
  unmount();
});

test("flags a pending governed sub-layer clearly, distinct from absent or done", () => {
  const draft: DraftIR = resolveSubLayerAsAbsent("discovery-and-governance", "No Governance Layer", "Not needed here.", {
    columns: { corePlatform: { subLayers: [{ registryId: "execution-and-capability", rows: [[{ title: "Booking Service" }]] }] } },
  });
  const { lastFrame, unmount } = render(<ReviewScreen draft={draft} onConfirm={() => {}} onEditSection={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("absent — No Governance Layer"));
  assert.ok(frame?.includes("⚠ pending")); // Entity Layer was never touched
  unmount();
});

test("shows an authoringNotes-recorded reason for an absent sub-layer (issue #89), without a gap note", () => {
  const draft: DraftIR = {
    columns: { corePlatform: { subLayers: [{ registryId: "execution-and-capability", rows: [[{ title: "Booking Service" }]] }] } },
    resolvedAbsentSubLayers: ["discovery-and-governance"],
    authoringNotes: { "Discovery and Governance": ["Not needed for this system."] },
  };
  const { lastFrame, unmount } = render(<ReviewScreen draft={draft} onConfirm={() => {}} onEditSection={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("absent — Not needed for this system."));
  unmount();
});

test("shows a bare \"absent\", with no reason, when doesn't-apply was chosen without one (issue #89)", () => {
  const draft: DraftIR = {
    columns: { corePlatform: { subLayers: [{ registryId: "execution-and-capability", rows: [[{ title: "Booking Service" }]] }] } },
    resolvedAbsentSubLayers: ["discovery-and-governance"],
  };
  const { lastFrame, unmount } = render(<ReviewScreen draft={draft} onConfirm={() => {}} onEditSection={() => {}} />);
  const frame = lastFrame();
  assert.ok(frame?.includes("Discovery and Governance: absent"));
  assert.ok(!frame?.includes("absent —"));
  unmount();
});

test("selecting \"Looks good — continue\" calls onConfirm with the current draft", async () => {
  const result: { confirmed: DraftIR | null } = { confirmed: null };
  const { stdin, unmount } = render(
    <ReviewScreen draft={FULL_DRAFT} onConfirm={(d) => { result.confirmed = d; }} onEditSection={() => {}} />
  );
  await submit(stdin); // "Looks good" is the first, already-highlighted option
  assert.equal(result.confirmed, FULL_DRAFT);
  unmount();
});

test("selecting an edit option calls onEditSection with the right section id", async () => {
  const result: { edited: SectionId[] } = { edited: [] };
  const { stdin, unmount } = render(
    <ReviewScreen draft={FULL_DRAFT} onConfirm={() => {}} onEditSection={(s) => { result.edited.push(s); }} />
  );
  await down(stdin); // "Looks good" -> "Edit Title..."
  await submit(stdin);
  assert.deepEqual(result.edited, ["intro"]);
  unmount();
});

test("selecting Edit Egress calls onEditSection(\"egress\")", async () => {
  const result: { edited: SectionId[] } = { edited: [] };
  const { stdin, unmount } = render(
    <ReviewScreen draft={FULL_DRAFT} onConfirm={() => {}} onEditSection={(s) => { result.edited.push(s); }} />
  );
  await down(stdin); // Looks good -> Edit Title
  await down(stdin); // Edit Title -> Edit Ingress
  await down(stdin); // Edit Ingress -> Edit Egress
  await submit(stdin);
  assert.deepEqual(result.edited, ["egress"]);
  unmount();
});

test("shows and safely edits an omitted legend", async () => {
  const result: { edited: SectionId[] } = { edited: [] };
  const draft = { ...FULL_DRAFT, includeLegend: false };
  const { stdin, lastFrame, unmount } = render(
    <ReviewScreen draft={draft} onConfirm={() => {}} onEditSection={(s) => { result.edited.push(s); }} />
  );
  assert.ok(lastFrame()?.includes("omitted"));

  await down(stdin); // Looks good -> Edit Title
  await down(stdin); // Edit Title -> Edit Ingress
  await down(stdin); // Edit Ingress -> Edit Egress
  await down(stdin); // Edit Egress -> Edit Legend
  await submit(stdin);
  assert.deepEqual(result.edited, ["legend"]);
  unmount();
});
