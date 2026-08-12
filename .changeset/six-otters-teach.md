---
"@archsmith/schema": patch
---

Add worked before/after examples distinguishing `item.eyebrow` (a short, generic domain/functional category — never a specific technology or vendor name) from `item.descriptionLines` (full-sentence detail, including technology/protocol specifics) — an author authoring an IR from free text had no way to disambiguate the two beyond a single one-line example on `eyebrow` and no description at all on `descriptionLines` (issue #58). No structural change; bumps `schemaVersion` to 0.3.3 since published schema versions are immutable archives.
