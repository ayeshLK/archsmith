# @archsmith/cli

## 0.6.2

### Patch Changes

- Updated dependencies [49eb318]
  - @archsmith/renderer@0.8.0

## 0.6.1

### Patch Changes

- Updated dependencies [a69a384]
- Updated dependencies [5dc31e1]
- Updated dependencies [9b3203f]
- Updated dependencies [4e45a4e]
- Updated dependencies [4e45a4e]
  - @archsmith/schema@0.7.0
  - @archsmith/renderer@0.7.0

## 0.6.0

### Minor Changes

- 07796e4: Add a `get_schema` MCP tool and `archsmith schema show` CLI command so a tool-oriented agent or CLI user can discover the diagram IR's structural JSON Schema directly, without needing to read the `archsmith://schema` MCP resource. `render`/`validate` tool descriptions now point agents at `get_schema` and `get_registry` before authoring an IR, and their responses include the same pointer whenever the IR turns out to be invalid.

## 0.5.2

### Patch Changes

- 78eb2e1: Derive the CLI's reported version from package metadata so releases cannot drift from `archsmith --version`.
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

- `archsmith validate`, `archsmith render`, `archsmith registries list|show`.
