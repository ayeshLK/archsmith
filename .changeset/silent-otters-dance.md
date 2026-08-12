---
"@archsmith/renderer": minor
---

`embedFonts: true` now embeds a font subset containing only the glyphs a diagram's own text actually needs, instead of the complete Arimo font (two full weights, a fixed ~40 KB regardless of diagram size — see issue #55). Subsetting is done synchronously via harfbuzz's raw WASM hb-subset exports, so `render()` stays a synchronous function; no change to its public signature. `embedFontsInSvg()` gained an optional second `subsetText` parameter — calling it with one argument, as existing callers do, keeps embedding the complete font unchanged.
