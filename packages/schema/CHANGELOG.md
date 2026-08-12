# @archsmith/schema

## 0.7.0

### Minor Changes

- 4e45a4e: `corePlatform.systemsOfRecord` now requires a `registryId` field (always `"systems-of-record"`), mirroring `subLayerInstance.registryId`. Previously the link between that section and the sub-layers registry's `systems-of-record` entry (its default accent color and tag) existed only as a one-directional breadcrumb in the registry's own notes, not as something the schema itself asserted (issue #57). Bumps `schemaVersion` to 0.3.2; every existing IR needs the new field added.

### Patch Changes

- a69a384: Clarify that the `unclassified` array holds both `gapNote` reasons, `unmapped-input` and `missing-layer` (e.g. a genuinely absent Entity Layer) — previously `unclassified`'s own description and `gapNote.reason`'s enum description only explicitly tied `unmapped-input` to it, leaving `missing-layer`'s placement ambiguous even though the renderer already reads both reasons from the same field. No behavior change; bumps `schemaVersion` to 0.3.1 since published schema versions are immutable archives.
- 9b3203f: Add worked before/after examples distinguishing `item.eyebrow` (a short, generic domain/functional category — never a specific technology or vendor name) from `item.descriptionLines` (full-sentence detail, including technology/protocol specifics) — an author authoring an IR from free text had no way to disambiguate the two beyond a single one-line example on `eyebrow` and no description at all on `descriptionLines` (issue #58). No structural change; bumps `schemaVersion` to 0.3.3 since published schema versions are immutable archives.

## 0.6.0

### Minor Changes

- 05c4855: Advance the IR schema to 0.3.0, add its stable editor-validation URL, and reject the incomplete accessible color family until its governed palette is fully designed and tested.

## 0.5.1

### Patch Changes

- 31c7af5: Add npm package metadata to improve discoverability and package page links.

## 0.5.0

### Initial release

- The diagram IR schema (JSON Schema draft 2020-12) and governed registries (`sub-layers`, `colors`, `icons`).
