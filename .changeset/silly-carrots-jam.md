---
"@archsmith/cli": minor
---

`archsmith author` now walks through Review after External Systems — every section shown in human terms, never a raw JSON dump, with any pending Core Platform sub-layer flagged clearly. From Review, editing Title/Subtitle/Deployed On, Ingress, or Egress jumps back into that section and returns to Review afterwards rather than continuing forward through the rest of the session. Jump-to-correct is intentionally offered only for those 3 scalar-only sections for now: the 4 repeatable-list sections (Inbound Actors, Core Platform's sub-layers and Systems of Record, External Systems) don't yet support re-entering a list in "append mode," so jumping back into one today would restart it from item 1 — that's deferred, not built here.

Along the way: `IntroScreen` and `GatewayScreen` now pre-fill their text inputs from the draft's existing value instead of always starting blank, since Review is the first place either screen can be re-entered with real data already in it.
