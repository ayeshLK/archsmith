# @archsmith/schema

The IR schema and governed registries for [ArchSmith](https://github.com/ayeshLK/archsmith) — the structural contract a diagram intermediate representation (IR) must satisfy, and the catalog of colors/sub-layer types it's allowed to reference.

See the [root README](https://github.com/ayeshLK/archsmith#readme) for what ArchSmith is and how the pieces fit together; this package is the schema layer only, consumed by `@archsmith/renderer` for validation.

## Files

- `diagram-schema.json` — JSON Schema (draft 2020-12) for the IR: the document a human or agent produces describing a layered architecture, and that `@archsmith/renderer` validates and renders to SVG. Fixed shape: 5 columns, Core Platform sub-layers stacked in order, systems-of-record as a sibling section below the "deployed on" wrapper.
- `registries/sub-layers.json` — the governed, extensible list of Core Platform sub-layer types (Discovery and Governance, Execution and Capability Layer, Entity Layer, Systems of Record and Knowledge).
- `registries/colors.json` — the governed color catalog. `standard` and `accessible` are active families with the same semantic token assignments; the accessible family is a color/contrast-safe alternative.
- `registries/icons.json` — six governed, explicit semantic item tokens (`actor`, `governance`, `service`, `entity`, `data-store`, `external`) with provenance and color-free 24×24 geometry. The registry permits only circle, ellipse, line, polyline, and rounded-rectangle primitives; it never stores arbitrary SVG markup. Geometry is rendered as a 2px monochrome outline at 16×16. See [icon governance](../../CONTRIBUTING.md#the-one-rule-that-matters-most-registries-are-governed-not-per-diagram) and the [source evaluation](../../docs/icon-design/README.md).

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
  "$schema": "https://ayeshlk.github.io/archsmith/schema/0.3.6/diagram-schema.json",
  "schemaVersion": "0.3.6"
}
```

Versioned URLs remain immutable. `https://ayeshlk.github.io/archsmith/schema/latest/diagram-schema.json` follows the newest schema and is useful for discovery, but committed diagrams should use the versioned URL for reproducibility.

## Governance model

Changing `diagram-schema.json`'s structure, or adding an entry to any registry, is a **deliberate change-request event** — never a decision made by a generation step or an end user mid-diagram. This is what keeps the format a consistent house style rather than free-form per-diagram layout. Bump `schemaVersion`/`registryVersion` on any such change.

What stays free per diagram (no change request needed): which already-approved sub-layers/colors/icons a given diagram uses, how many rows of boxes a layer has, and whether a legend or notes callout is included. Both governed color families are selectable; their token ids preserve the same semantic assignments.

Icons are always explicit. Inbound Actor and External Systems icons replace their colored dot; when omitted or null, the existing `dotColor` dot remains. Core Platform icons appear before the title in the containing sub-layer accent; iconless Core Platform items remain marker-free. Icons are never inferred from titles, locations, or colors. Gateway glyphs and warning pills are separate treatments. The Google Material Symbols references are redrawn to ArchSmith's outline contract; published packages include the upstream Apache-2.0 license and provenance notice.

## License

Apache-2.0
