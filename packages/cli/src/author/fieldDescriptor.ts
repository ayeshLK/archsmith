import type { DraftIR } from "./draftIr.js";

export type SectionStatus = "done" | "absent" | "pending";

export type FieldKind = "text" | "optionalText" | "pickOne" | "repeatable" | "threeState";

/**
 * One lens over the draft IR tree — a getter and a setter for one editable
 * value, addressed by a stable id rather than a step position (order is a
 * separate, thin concern from identity — see the Mechanism discussion on
 * issue #67). write() must merge onto the existing draft, never reconstruct
 * it from scratch, so any sibling field a descriptor doesn't know about
 * rides along untouched — the same discipline Phase 1.5's read/edit
 * direction will need, built in from the start rather than retrofitted.
 */
export interface FieldDescriptor<TValue> {
  id: string;
  kind: FieldKind;
  hint: string;
  read(draft: DraftIR): TValue | undefined;
  write(draft: DraftIR, value: TValue): DraftIR;
  status?(draft: DraftIR): SectionStatus;
}
