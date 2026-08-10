# @archsmith/mcp-server

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
