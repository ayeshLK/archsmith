---
"@archsmith/cli": minor
---

`archsmith author` can now resolve a title that doesn't fit even after wrapping to two lines (issue #67/#68). Once Review is confirmed, a dry-run render checks for any item render() flags via its `needsAcronym` signal; if any are found, a new screen asks for one short acronym per flagged title — skippable, leaving the renderer's own existing overflow handling in place for whatever's left unresolved — before proceeding to the normal Save step. Previously the wizard had no way to author `item.acronym` at all, despite this being planned as in-scope for v1 in the original design.
