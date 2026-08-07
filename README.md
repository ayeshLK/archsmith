# ArchSmith

A renderer, CLI, and MCP server for generating layered/swimlane enterprise architecture diagrams (SVG output) from a validated JSON intermediate representation (IR).

## Status: renderer + CLI working end-to-end — MCP server not yet built

This repo is being built in phases; see `packages/` below for what exists so far.

- `packages/schema` — the IR schema (`diagram-schema.json`, JSON Schema draft 2020-12) and governed registries (`registries/sub-layers.json`, `colors.json`, `icons.json`). These define what a valid diagram description looks like, and are versioned independently of the renderer/CLI/MCP packages — adding a registry entry (a new sub-layer type, color, or icon) is a deliberate change-request event, not a per-diagram or runtime decision.
- `packages/renderer` — validates an IR document against the schema and registries, and renders a valid IR to a complete SVG document (`render()`). Measures text against a bundled Arimo font (metric-compatible with Arial) and, by default, embeds that same font into the output SVG so a diagram renders identically regardless of what's installed on the viewing machine.
- `packages/cli` — `archsmith validate`, `archsmith render`, and `archsmith registries list|show` all work.
- `packages/mcp-server` — not implemented yet.

## CLI usage

```bash
archsmith validate <input.json> [--json]
archsmith render <input.json> -o <out.svg> [--no-embed-fonts] [--pretty]
archsmith registries list
archsmith registries show <sub-layers|colors|icons> [--family standard|accessible]
```

`render` validates the IR first and fails the same way `validate` would (exit 1) if it's invalid; a rendering-time error (as opposed to a validation failure) exits 2. `--no-embed-fonts` skips embedding the bundled font, producing a smaller file. `--pretty` indents the output SVG's element lines for readability (the default is one element per line, unindented).

## Where this came from

ArchSmith generalizes a hand-tuned Python prototype built and validated in a separate private prototyping repo. Every rendering-mechanics rule here (text wrapping, content-driven box sizing, the gateway icon, outer column frames, a 3-tier width/wrap/acronym decision system, etc.) was discovered and pixel-measured against reference templates there before being ported here as a general-purpose TypeScript implementation.

## Development

```bash
npm install
npm run build
npm test

# Validate an example IR document
node packages/cli/dist/index.js validate examples/minimal-valid.ir.json

# Render the fictional "Novera" example (exercises every schema feature)
node packages/cli/dist/index.js render examples/novera.ir.json -o /tmp/novera.svg
```

## License

Apache-2.0
