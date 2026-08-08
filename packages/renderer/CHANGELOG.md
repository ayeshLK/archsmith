# @archsmith/renderer

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
