---
"@archsmith/cli": minor
---

`archsmith author` now walks through Core Platform's 3 governed sub-layers (Discovery and Governance, Execution and Capability, Entity Layer) after Ingress, via a new `CorePlatformSubLayersScreen`. For each, you decide whether it applies ("Yes" walks the shared item sub-flow to add its boxes, "No" records a short gap note explaining the omission, "Not sure yet" skips it for now) — reusing `gapResolution.ts`'s existing done/absent/pending derivation rather than tracking a separate status. Systems of Record (a distinct, always-required section, not one of these optional sub-layers) isn't built yet, so navigation doesn't advance past Core Platform until it exists — the same "don't wire past what's built" scoping already used for Egress.

Along the way: `subLayerItemsAccessor` now accepts an optional `registryId` to seed a brand-new sub-layer instance correctly on its first write (previously defaulted to an empty registryId), and a genuine `ink-select-input` bug was caught by the new component tests — its highlighted-option state persists across re-renders unless remounted, so re-showing the same decide prompt for the next sub-layer silently carried over the previous layer's cursor position. Fixed by keying the `SelectInput` on the current layer index, the same remount-per-step technique already used for `ItemSubFlow` across repeatable-list items.
