---
"@archsmith/schema": minor
---

`corePlatform.systemsOfRecord` now requires a `registryId` field (always `"systems-of-record"`), mirroring `subLayerInstance.registryId`. Previously the link between that section and the sub-layers registry's `systems-of-record` entry (its default accent color and tag) existed only as a one-directional breadcrumb in the registry's own notes, not as something the schema itself asserted (issue #57). Bumps `schemaVersion` to 0.3.2; every existing IR needs the new field added.
