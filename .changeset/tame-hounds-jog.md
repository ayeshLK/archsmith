---
"@archsmith/cli": patch
---

Fixed `archsmith author` rendering every Core Platform sub-layer's items as a vertical stack of one-item rows instead of paired columns (issue #88). `rowGrouping.ts`'s `suggestRowGrouping()` — written to produce the same 2-per-row pairing every real example uses — was never actually wired into any screen; adding items one at a time through `CorePlatformSubLayersScreen` always fell back to `subLayerItemsAccessor`'s one-item-per-row default, since that accessor only preserves an existing row shape on a same-count edit and has no way to know a list is "done." A new `applySuggestedRowGrouping()` re-groups a finished sub-layer's items into the real 2-2-1-style pairing once its item list ends, before advancing to the next sub-layer.
