---
"@archsmith/schema": patch
---

Clarify that the `unclassified` array holds both `gapNote` reasons, `unmapped-input` and `missing-layer` (e.g. a genuinely absent Entity Layer) — previously `unclassified`'s own description and `gapNote.reason`'s enum description only explicitly tied `unmapped-input` to it, leaving `missing-layer`'s placement ambiguous even though the renderer already reads both reasons from the same field. No behavior change; bumps `schemaVersion` to 0.3.1 since published schema versions are immutable archives.
