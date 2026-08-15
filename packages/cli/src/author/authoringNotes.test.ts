import { test } from "node:test";
import assert from "node:assert/strict";
import { appendAuthoringNote } from "./authoringNotes.js";

test("appendAuthoringNote accumulates notes for the same section in order", () => {
  let notes = appendAuthoringNote({}, "Core Platform — Entity Layer", "First note");
  notes = appendAuthoringNote(notes, "Core Platform — Entity Layer", "Second note");
  assert.deepEqual(notes["Core Platform — Entity Layer"], ["First note", "Second note"]);
});

test("appendAuthoringNote doesn't disturb a different section's notes", () => {
  let notes = appendAuthoringNote({}, "Ingress", "Note about ingress");
  notes = appendAuthoringNote(notes, "Egress", "Note about egress");
  assert.deepEqual(notes["Ingress"], ["Note about ingress"]);
  assert.deepEqual(notes["Egress"], ["Note about egress"]);
});
