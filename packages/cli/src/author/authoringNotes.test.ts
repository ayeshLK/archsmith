import { test } from "node:test";
import assert from "node:assert/strict";
import { appendAuthoringNote, renderAuthoringNotesMarkdown } from "./authoringNotes.js";

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

test("renderAuthoringNotesMarkdown produces one H2 per section with notes, in touched order", () => {
  let notes = appendAuthoringNote({}, "Core Platform — Entity Layer", "Domain concepts worth modeling separately.");
  notes = appendAuthoringNote(notes, "External Systems", "Grouped by vendor relationship.");
  const md = renderAuthoringNotesMarkdown("My Diagram", notes);
  assert.equal(
    md,
    "# My Diagram — Authoring Notes\n\n" +
      "## Core Platform — Entity Layer\n\n" +
      "- Domain concepts worth modeling separately.\n\n" +
      "## External Systems\n\n" +
      "- Grouped by vendor relationship.\n"
  );
});

test("renderAuthoringNotesMarkdown with zero notes still produces a real, honest file", () => {
  const md = renderAuthoringNotesMarkdown("My Diagram", {});
  assert.equal(md, "# My Diagram — Authoring Notes\n\nNo notes recorded for this session.\n");
});

test("a section that ended up with zero notes (e.g. all removed) is omitted from the rendered output", () => {
  const notes = { "Empty Section": [] };
  const md = renderAuthoringNotesMarkdown("My Diagram", notes);
  assert.ok(!md.includes("Empty Section"));
});
