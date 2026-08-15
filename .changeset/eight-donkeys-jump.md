---
"@archsmith/renderer": minor
"@archsmith/cli": minor
---

Redesigned how Core Platform's governed sub-layers handle optionality (issue #89), grounded in real usage data: `execution-and-capability` appears in 100% of ArchSmith's own example diagrams, while `discovery-and-governance` and `entity-layer` are each absent from roughly half of them — the opposite of what the registry's own documentation implied.

- **`@archsmith/renderer`**: `validate()` now requires `corePlatform.subLayers` to include an `execution-and-capability` entry, the same way `systemsOfRecord.registryId` is already checked — a plain, clearly-worded semantic check, not a JSON-Schema constraint (this codebase already rejected that approach once for producing unhelpful "must be equal to constant" errors). This is a real behavior change: a hand-authored or LLM-authored IR missing this sub-layer will now fail validation where it previously passed.
- **`@archsmith/cli`**: `archsmith author`'s Core Platform screen now treats `execution-and-capability` as mandatory — no "doesn't apply"/"not sure" options, straight to adding its items, the same treatment `systemsOfRecord` already gets. `discovery-and-governance` and `entity-layer` stay optional and three-state, but selecting "No — doesn't apply" no longer forces a rendered "GAP — NOT IMPLEMENTED" box into the diagram. Instead, the layer is marked confirmed-absent via a draft-only marker (never part of the real IR), and an *optional* reason — skippable, like every other secondary field in the wizard — is recorded into a new sidecar `diagram.authoring-notes.md` file (written by `FinalStepScreen` for the first time) rather than into `unclassified`/the rendered SVG. The `authoringNotes.ts` sidecar mechanism itself was built back in Phase 1 for exactly this purpose but had never been wired into any screen until now.

The renderer's own gap-note rendering capability is untouched — still correct for hand-authored/LLM-authored IR, where nothing walks the author through an explicit per-layer decision the way the wizard's interview does.
