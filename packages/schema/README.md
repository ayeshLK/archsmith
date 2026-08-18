# @archsmith/schema

The IR schema and governed registries for [ArchSmith](https://github.com/ayeshLK/archsmith) — the structural contract a diagram intermediate representation (IR) must satisfy, and the catalog of colors/sub-layer types it's allowed to reference.

See the [root README](https://github.com/ayeshLK/archsmith#readme) for what ArchSmith is and how the pieces fit together; this package is the schema layer only, consumed by `@archsmith/renderer` for validation.

## Files

- `diagram-schema.json` — JSON Schema (draft 2020-12) for the IR: the document a human or agent produces describing a layered architecture, and that `@archsmith/renderer` validates and renders to SVG. Fixed shape: 5 columns, Core Platform sub-layers stacked in order, systems-of-record as a sibling section below the "deployed on" wrapper.
- `registries/sub-layers.json` — the governed, extensible list of Core Platform sub-layer types (Discovery and Governance, Execution and Capability Layer, Entity Layer, Systems of Record and Knowledge).
- `registries/colors.json` — the governed color catalog. The `standard` family is fully populated; `accessible` (a colorblind/contrast-safe palette) has the right structure but no values yet — [tracked here](https://github.com/ayeshLK/archsmith/issues/7).
- `registries/icons.json` — placeholder only. Categories that will need icons are listed; no actual icon tokens are defined yet, deliberately, to avoid inventing bespoke icon shapes ad hoc — [tracked here](https://github.com/ayeshLK/archsmith/issues/6). Items without an icon render as a plain colored dot.

## Usage

```ts
import { getDiagramSchema, getRegistry, listRegistryNames } from "@archsmith/schema";

const schema = getDiagramSchema(); // the parsed diagram-schema.json
const colors = getRegistry("colors"); // one governed registry, parsed
listRegistryNames(); // ["sub-layers", "colors", "icons"]
```

In practice you'll rarely call this package directly — `@archsmith/renderer`'s `validate()`/`render()` already do, and `@archsmith/mcp-server` exposes the schema and each registry as MCP resources for an agent to read live.

## Editor support

The ArchSmith schema is registered with [SchemaStore](https://www.schemastore.org/), so any file named `*.archsmith.json` gets autocomplete and inline validation for free in VS Code, JetBrains IDEs, Neovim (coc.nvim / nvim-lspconfig), and any other SchemaStore-aware editor — no `$schema` line needed. This is the recommended default; SchemaStore points at `schema/latest/diagram-schema.json`, so it always validates against the newest schema.

If your file doesn't match that naming pattern, or you want to pin validation to the exact schema version you authored against, add the `$schema` field manually:

```json
{
  "$schema": "https://ayeshlk.github.io/archsmith/schema/0.3.4/diagram-schema.json",
  "schemaVersion": "0.3.4"
}
```

Versioned URLs remain immutable. `https://ayeshlk.github.io/archsmith/schema/latest/diagram-schema.json` follows the newest schema and is useful for discovery, but committed diagrams should use the versioned URL for reproducibility.

## Governance model

Changing `diagram-schema.json`'s structure, or adding an entry to any registry, is a **deliberate change-request event** — never a decision made by a generation step or an end user mid-diagram. This is what keeps the format a consistent house style rather than free-form per-diagram layout. Bump `schemaVersion`/`registryVersion` on any such change.

What stays free per diagram (no change request needed): which already-approved sub-layers/colors/icons a given diagram uses, how many rows of boxes a layer has, and whether a legend or notes callout is included. Only the `standard` color family is currently selectable; `accessible` remains a governed placeholder until its palette is complete.

## License

Apache-2.0
