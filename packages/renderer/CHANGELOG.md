# @archsmith/renderer

## 0.7.0

### Minor Changes

- 5dc31e1: `embedFonts: true` now embeds a font subset containing only the glyphs a diagram's own text actually needs, instead of the complete Arimo font (two full weights, a fixed ~40 KB regardless of diagram size — see issue #55). Subsetting is done synchronously via harfbuzz's raw WASM hb-subset exports, so `render()` stays a synchronous function; no change to its public signature. `embedFontsInSvg()` gained an optional second `subsetText` parameter — calling it with one argument, as existing callers do, keeps embedding the complete font unchanged.

### Patch Changes

- 4e45a4e: `corePlatform.systemsOfRecord`'s accent color and tag now come from looking up its new `registryId` field (see the `@archsmith/schema` changeset for issue #57) instead of a hardcoded `"systems-of-record"` literal — the field genuinely drives the render, it isn't just a validated-and-ignored assertion. `validateRegistryReferences` rejects any value other than `"systems-of-record"` with an explanatory error, since unlike `subLayers[].registryId` there is exactly one correct value for this field.
- Updated dependencies [a69a384]
- Updated dependencies [9b3203f]
- Updated dependencies [4e45a4e]
  - @archsmith/schema@0.7.0

## 0.6.0

### Minor Changes

- 05c4855: Advance the IR schema to 0.3.0, add its stable editor-validation URL, and reject the incomplete accessible color family until its governed palette is fully designed and tested.

### Patch Changes

- Updated dependencies [05c4855]
  - @archsmith/schema@0.6.0

## 0.5.1

### Patch Changes

- 31c7af5: Add npm package metadata to improve discoverability and package page links.
- Updated dependencies [31c7af5]
  - @archsmith/schema@0.5.1

## 0.5.0

### Initial release

- `validate()` and `render()` — IR in, SVG out. Pure function, no LLM dependency.
- Text measured against a bundled Arimo font (via `fontkit`); the same font is embedded in the output SVG by default, so a diagram renders identically regardless of what's installed on the viewing machine.
