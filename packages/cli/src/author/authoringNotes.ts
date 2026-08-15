/**
 * Per-section authoring rationale — e.g. "why did you mark this optional
 * Core Platform layer absent" — kept entirely separate from the
 * schema-shaped DraftIR fields and never rendered (issue #89: the
 * wizard's own interview process already guards against accidental
 * omission, so a reason doesn't need to be forced into the diagram to be
 * trustworthy). Keyed by a human-readable section label.
 *
 * Deliberately in-memory only, for the current session — shown back on
 * ReviewScreen so the user can see and confirm their own reasoning before
 * finishing, then discarded once the session ends. An earlier version of
 * this feature persisted these to a sidecar `diagram.authoring-notes.md`
 * file, but that was reverted (issue #93): nothing reads a persisted note
 * back today, the only plausible future reader is issue #67's own
 * undesigned Phase 1.5 (editing/resuming a draft), and committing to any
 * storage format now — markdown, JSON, or a new schema field — risks a
 * breaking change once Phase 1.5's actual needs are known. Revisit
 * persistence once that phase is real.
 */
export type AuthoringNotes = Record<string, string[]>;

/** Appends one note under `sectionLabel`, preserving whatever notes were
 * already recorded there and their order. */
export function appendAuthoringNote(notes: AuthoringNotes, sectionLabel: string, note: string): AuthoringNotes {
  const existing = notes[sectionLabel] ?? [];
  return { ...notes, [sectionLabel]: [...existing, note] };
}
