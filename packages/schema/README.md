# ArchSmith schema — v0.1.0 (draft)

This is the first draft of the structural half of the ruleset: **schema + governed registries + (later) a deterministic renderer**. No `SKILL.md` or renderer exists yet — this directory only defines what a valid diagram description looks like.

## Files

- `diagram-schema.json` — JSON Schema for the IR (intermediate representation): the structured document an LLM should produce from a rough sketch/text description, and that a future renderer consumes to emit SVG. Fixed shape: 5 columns, Core Platform sub-layers stacked in order, systems-of-record as a sibling section below the "deployed on" wrapper.
- `registries/sub-layers.json` — the governed, extensible list of Core Platform sub-layer types. Seeded with the 4 observed across all sources: Discovery and Governance, Execution and Capability Layer, Entity Layer, Systems of Record and Knowledge.
- `registries/colors.json` — the governed color catalog. `standard` family is populated from a validated reference build's actual hex values. `accessible` family is a planned second palette (secondary priority) — structure is present, values are not yet chosen.
- `registries/icons.json` — placeholder only. Categories that will need icons are listed; no actual icon tokens are defined yet, deliberately, to avoid inventing bespoke icon shapes ad hoc (an earlier draft's DB-cylinder-icon mistake documents why).

## Governance model

Changing `diagram-schema.json`'s structure, or adding an entry to any registry, is a **deliberate change-request event** — never a decision made by the generation-time LLM or by an end user mid-diagram. This is what keeps the format a "house style" rather than free-form AI diagramming as it scales toward being a published plugin. Bump `schemaVersion`/`registryVersion` on any such change.

What stays free per diagram (no change request needed): which already-approved sub-layers/colors/icons a given diagram uses, how many rows of boxes a layer has, whether a notes callout is included, which color family is active.

## Open items not yet resolved in this draft

- Icon catalog contents (`registries/icons.json` is a placeholder — needs a follow-up design pass on visual style before any token gets a real value).
- `accessible` color family values.
- The IR-authoring step itself: how an LLM should turn a rough sketch or text description into a document conforming to `diagram-schema.json` isn't specified yet — this schema only defines the target shape, not the extraction process.
- No renderer exists yet. This schema is deliberately renderer-agnostic — rendering mechanics (text wrapping, pill-width measurement, uniform row height, `rect rx/ry` not `clip-path`) belong in that future renderer's code, not in this schema.
