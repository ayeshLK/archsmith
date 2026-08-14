/**
 * Per-section authoring rationale — e.g. "why did you include this
 * optional layer" — kept entirely separate from DraftIR and never written
 * into the schema-shaped IR itself (see the #67 Mechanism discussion:
 * derived/governed data stays in DraftIR, human rationale stays here,
 * consistent with the #3 plan's stance on keeping rationale out of
 * governed data). Keyed by a human-readable section label rather than a
 * raw id, since that's exactly what becomes the sidecar file's own
 * section headings — no separate id-to-label lookup needed at render time.
 */
export type AuthoringNotes = Record<string, string[]>;

/** Appends one note under `sectionLabel`, preserving whatever notes were
 * already recorded there and their order. */
export function appendAuthoringNote(notes: AuthoringNotes, sectionLabel: string, note: string): AuthoringNotes {
  const existing = notes[sectionLabel] ?? [];
  return { ...notes, [sectionLabel]: [...existing, note] };
}

/**
 * Renders the sidecar `diagram.authoring-notes.md` content: one H2
 * heading per section that has at least one note, in the order each
 * section was first touched, bullets underneath in the order notes were
 * added. A session with zero notes still produces a real, honest file
 * rather than nothing — silently skipping the file would look like a bug,
 * not a diagram that simply needed no explanation.
 */
export function renderAuthoringNotesMarkdown(diagramTitle: string, notes: AuthoringNotes): string {
  const sections = Object.entries(notes).filter(([, lines]) => lines.length > 0);
  if (sections.length === 0) {
    return `# ${diagramTitle} — Authoring Notes\n\nNo notes recorded for this session.\n`;
  }
  const body = sections.map(([label, lines]) => `## ${label}\n\n${lines.map((line) => `- ${line}`).join("\n")}`).join("\n\n");
  return `# ${diagramTitle} — Authoring Notes\n\n${body}\n`;
}
