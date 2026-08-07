# @archsmith/renderer

The [ArchSmith](https://github.com/ayeshLK/archsmith) renderer — a validated diagram IR in, a complete SVG document out. Pure function, no I/O beyond reading its own bundled font, no LLM dependency.

See the [root README](https://github.com/ayeshLK/archsmith#readme) for what ArchSmith is, what the IR looks like, and why the renderer is built this way.

## Usage

```ts
import { render, validate } from "@archsmith/renderer";

const result = validate(ir); // { valid: boolean, errors: string[] }
if (result.valid) {
  const svg = render(ir); // complete SVG document, as a string
}
```

`render()` validates the IR itself before rendering (pass `{ skipValidate: true }` to skip, e.g. if you've already validated). By default it embeds the bundled Arimo font into the output SVG so a diagram renders identically regardless of what's installed on the machine viewing it — pass `{ embedFonts: false }` to skip that and get a smaller file.

## What's in here

- `validate()` / `validateStructure()` / `validateRegistryReferences()` — schema (structural) and registry-reference (semantic) validation against `@archsmith/schema`.
- `render()` — the full IR → SVG pipeline: measure, lay out five columns, assemble, optionally embed fonts.
- `measureText()` / `wrapText()` — real glyph-advance-width text measurement (via `fontkit` against the bundled Arimo font) and word wrapping, used throughout layout instead of a flat character-count heuristic.
- SVG primitives and box-drawing functions (`rect`, `text`, `pill`, `actorBox`, `itemBox`, `clusterBox`, `gatewayBox`, `layerFrame`, …) if you want to compose diagram fragments yourself rather than going through `render()`.

Everything here is content-driven: box sizes, text wrapping, and row heights are computed from the actual IR content, never a fixed number the caller supplies and hopes is big enough.

## License

Apache-2.0
