---
"@archsmith/cli": minor
---

`archsmith author` can now author `item.pill` (issue #97), grounded in real usage data: pills appear on Systems of Record items in 7/9 example diagrams (always `semantic: "primary"`) and on every External Systems item that has one at all (28/28, always `semantic: "viaEgress"`) — a real architectural differentiator, not a decorative option. Previously the only way to set a pill was hand-editing the saved `.archsmith.json`.

Pill support differs by section, matching what the renderer actually does with it:

- **Inbound Actors**: no pill step at all — `actorBox` has no rendering support for it, so there's nothing to guide anyone toward.
- **Systems of Record / Core Platform sub-layers**: a free-text label (Enter to skip the pill entirely), then, if a label was given, a semantic picker over the 4 semantics that are ever meaningful outside External Systems (Primary, Warning, Highlight, Layer accent).
- **External Systems**: a single yes/no ("Reached via the Egress gateway?"), no text entry — `renderExternalSystems` ignores `pill.semantic` entirely and always resolves the same color, and every real example uses the identical label text `"via egress"`, so there's no real choice to ask about.

The pill step sits 2nd in `ItemSubFlow`, right after Title.

While rebuilding this shared flow, `eyebrow` (already in the wizard) got the same data-first look: its 6 real uses across every example are 100% concentrated in Core Platform's `discovery-and-governance` sub-layer, never anywhere else. `ItemSubFlow`'s step order is now Title → Pill → Description → Eyebrow (previously Title → Eyebrow → Description → Color accent), and the Eyebrow step itself only appears for `discovery-and-governance` items — skipped for every other section, where an item's own sub-layer or section already tells you what kind of thing it is.

Everything narrowed here is still reachable by hand-editing the saved JSON — the wizard guides toward the well-trodden path without removing any schema capability.
