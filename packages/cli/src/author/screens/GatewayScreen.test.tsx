import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate as flushImmediate } from "node:timers/promises";
import React from "react";
import { render } from "ink-testing-library";
import { GatewayScreen } from "./GatewayScreen.js";
import { ingressGatewayDescriptors, egressGatewayDescriptors } from "../scalarDescriptors.js";
import type { DraftIR } from "../draftIr.js";

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

test("shows the title and the label field's hint before anything is typed", () => {
  const { lastFrame, unmount } = render(
    <GatewayScreen draft={{}} descriptors={ingressGatewayDescriptors} title="Ingress" onComplete={() => {}} />
  );
  const frame = lastFrame();
  assert.ok(frame?.includes("Ingress"));
  assert.ok(frame?.includes(ingressGatewayDescriptors.label.hint));
  unmount();
});

test("submitting the label advances to the sublabel field", async () => {
  const { stdin, lastFrame, unmount } = render(
    <GatewayScreen draft={{}} descriptors={ingressGatewayDescriptors} title="Ingress" onComplete={() => {}} />
  );
  await typeAndSubmit(stdin, "API Gateway");
  const frame = lastFrame();
  assert.ok(frame?.includes("sublabel"));
  assert.ok(!frame?.includes("API Gateway")); // that field's own value isn't shown once we've moved on
  unmount();
});
test("an empty required label stays on the label field and explains what is missing", async () => {
  let completed = false;
  const { stdin, lastFrame, unmount } = render(
    <GatewayScreen draft={{}} descriptors={ingressGatewayDescriptors} title="Ingress" onComplete={() => { completed = true; }} />
  );

  await submit(stdin);

  assert.ok(lastFrame()?.includes("Can't finish yet — Ingress label is required."));
  assert.equal(completed, false);
  unmount();
});


test("submitting both fields calls onComplete with the gateway written onto the draft", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, unmount } = render(
    <GatewayScreen
      draft={{}}
      descriptors={ingressGatewayDescriptors}
      title="Ingress"
      onComplete={(draft) => { result.completed = draft; }}
    />
  );

  await typeAndSubmit(stdin, "API Gateway");
  await typeAndSubmit(stdin, "Kong");

  assert.deepEqual(result.completed?.columns?.ingress?.gateway, { label: "API Gateway", sublabel: "Kong" });
  unmount();
});

test("skipping the sublabel with an empty submission writes null, not an empty string", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, unmount } = render(
    <GatewayScreen
      draft={{}}
      descriptors={ingressGatewayDescriptors}
      title="Ingress"
      onComplete={(draft) => { result.completed = draft; }}
    />
  );

  await typeAndSubmit(stdin, "API Gateway");
  await typeAndSubmit(stdin, "");

  assert.deepEqual(result.completed?.columns?.ingress?.gateway, { label: "API Gateway", sublabel: null });
  unmount();
});

test("the same component works for egress, writing onto columns.egress instead", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, unmount } = render(
    <GatewayScreen
      draft={{}}
      descriptors={egressGatewayDescriptors}
      title="Egress"
      onComplete={(draft) => { result.completed = draft; }}
    />
  );

  await typeAndSubmit(stdin, "Egress Proxy");
  await typeAndSubmit(stdin, "Envoy");

  assert.deepEqual(result.completed?.columns?.egress?.gateway, { label: "Egress Proxy", sublabel: "Envoy" });
  assert.equal(result.completed?.columns?.ingress, undefined);
  unmount();
});

test("re-entering with an already-populated gateway pre-fills label and sublabel, not blank", async () => {
  const existing: DraftIR = { columns: { ingress: { gateway: { label: "API Gateway", sublabel: "Kong" } } } };
  const result: { completed: DraftIR | null } = { completed: null };
  const { stdin, lastFrame, unmount } = render(
    <GatewayScreen
      draft={existing}
      descriptors={ingressGatewayDescriptors}
      title="Ingress"
      onComplete={(draft) => { result.completed = draft; }}
    />
  );

  assert.ok(lastFrame()?.includes("API Gateway"));
  await submit(stdin); // accept the pre-filled label as-is, unchanged
  assert.ok(lastFrame()?.includes("Kong"));
  await submit(stdin); // accept the pre-filled sublabel as-is, unchanged

  assert.deepEqual(result.completed?.columns?.ingress?.gateway, { label: "API Gateway", sublabel: "Kong" });
  unmount();
});

test("preserves an existing draft's unrelated fields", async () => {
  const result: { completed: DraftIR | null } = { completed: null };
  const initialDraft: DraftIR = { title: "My Diagram" };
  const { stdin, unmount } = render(
    <GatewayScreen
      draft={initialDraft}
      descriptors={ingressGatewayDescriptors}
      title="Ingress"
      onComplete={(draft) => { result.completed = draft; }}
    />
  );

  await typeAndSubmit(stdin, "API Gateway");
  await typeAndSubmit(stdin, "");

  assert.equal(result.completed?.title, "My Diagram");
  unmount();
});
