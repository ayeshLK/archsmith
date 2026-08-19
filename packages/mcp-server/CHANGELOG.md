# @archsmith/mcp-server

## 0.7.3

### Patch Changes

- Updated dependencies [c82f55a]
- Updated dependencies [872d3f1]
  - @archsmith/schema@0.8.0
  - @archsmith/renderer@0.10.0

## 0.7.2

### Patch Changes

- Updated dependencies [37f316f]
  - @archsmith/renderer@0.9.0

## 0.7.1

### Patch Changes

- Updated dependencies [49eb318]
  - @archsmith/renderer@0.8.0

## 0.7.0

### Minor Changes

- cb0e8b4: `render` now returns a `resource_link` instead of inline text once the SVG exceeds 25,000 bytes (a large diagram, or `embedFonts: true` pushing an already-sizeable one over the line), fetchable via `resources/read` on the returned `archsmith://render/<id>` URI. Unlike font subsetting (issue #55), which only shrinks a cost that still scales with diagram content, this removes the ceiling on render size entirely — the tool result itself never grows unbounded. Renders below the threshold are unaffected. Backed by a small in-memory store bounded to the most recent 20 renders; reading an evicted or unknown id returns a standard `-32002` ("Resource not found") JSON-RPC error.

### Patch Changes

- 5dc31e1: Update the `render` tool's `embedFonts` description now that embedding uses a font subset sized to the diagram's own text (see the `@archsmith/renderer` changeset) rather than a fixed ~40 KB regardless of content.
- 4fbf2d9: Clarify that `render`'s `embedFonts: true` adds a fixed ~40 KB regardless of diagram size — not a size-proportional cost — since that alone can exceed common MCP client result limits even for small diagrams. Add a regression test pinning this cost against a modest, everyday fixture (not just the maximal stress case), so it's caught if it grows further.
- Updated dependencies [a69a384]
- Updated dependencies [5dc31e1]
- Updated dependencies [9b3203f]
- Updated dependencies [4e45a4e]
- Updated dependencies [4e45a4e]
  - @archsmith/schema@0.7.0
  - @archsmith/renderer@0.7.0

## 0.6.1

### Patch Changes

- bd10d8b: Keep MCP render responses within practical client result limits by returning one SVG text block and defaulting font embedding to false. Portable font-embedded output remains available with `embedFonts: true`; the renderer library and CLI defaults are unchanged.

## 0.6.0

### Minor Changes

- 07796e4: Add a `get_schema` MCP tool and `archsmith schema show` CLI command so a tool-oriented agent or CLI user can discover the diagram IR's structural JSON Schema directly, without needing to read the `archsmith://schema` MCP resource. `render`/`validate` tool descriptions now point agents at `get_schema` and `get_registry` before authoring an IR, and their responses include the same pointer whenever the IR turns out to be invalid.

### Patch Changes

- 5740912: Derive the advertised MCP server version from `package.json` at runtime instead of a hard-coded constant, so it never drifts from the published package version.

## 0.5.2

### Patch Changes

- Updated dependencies [05c4855]
  - @archsmith/schema@0.6.0
  - @archsmith/renderer@0.6.0

## 0.5.1

### Patch Changes

- 31c7af5: Add npm package metadata to improve discoverability and package page links.
- Updated dependencies [31c7af5]
  - @archsmith/renderer@0.5.1
  - @archsmith/schema@0.5.1

## 0.5.0

### Initial release

- `archsmith-mcp` — exposes `render`, `validate`, `list_registries`, `get_registry` as MCP tools, and the schema plus each registry as MCP resources, over stdio.
