---
"@archsmith/cli": minor
---

`archsmith author` now walks through Inbound Actors after the intro screen, using a new reusable `ItemSubFlow` component (title → category → description lines → color accent) — the grouped multi-field pattern the earlier plan expected `ink-form` to provide, hand-built from `ink-select-input`/`ink-text-input` instead since `ink-form` turned out to be stale. The color picker only ever offers the real, governed color tokens (`purple`/`green`/`teal`/`amber`/`navy`/`mint`), checked directly against `registries/colors.json` and how the renderer's `resolveDotColor()` actually consumes this field. Submitting an empty title — on any item, including the first — ends the repeatable list rather than being treated as an empty item; an Inbound Actors section with zero items is left for `validate()` to catch, not duplicated here.
