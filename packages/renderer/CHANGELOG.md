# @archsmith/renderer

## 0.5.0

### Initial release

- `validate()` and `render()` — IR in, SVG out. Pure function, no LLM dependency.
- Text measured against a bundled Arimo font (via `fontkit`); the same font is embedded in the output SVG by default, so a diagram renders identically regardless of what's installed on the viewing machine.
