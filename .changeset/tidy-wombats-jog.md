---
"@archsmith/renderer": patch
---

`corePlatform.systemsOfRecord`'s accent color and tag now come from looking up its new `registryId` field (see the `@archsmith/schema` changeset for issue #57) instead of a hardcoded `"systems-of-record"` literal — the field genuinely drives the render, it isn't just a validated-and-ignored assertion. `validateRegistryReferences` rejects any value other than `"systems-of-record"` with an explanatory error, since unlike `subLayers[].registryId` there is exactly one correct value for this field.
