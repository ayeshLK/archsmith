# ArchSmith

A renderer, CLI, and MCP server for generating layered/swimlane enterprise architecture diagrams (SVG output) from a validated JSON intermediate representation (IR).

## Status: early — Phase 0 (scaffold)

This repo is being built in phases; see `packages/` below for what exists so far.

- `packages/schema` — the IR schema (`diagram-schema.json`, JSON Schema draft 2020-12) and governed registries (`registries/sub-layers.json`, `colors.json`, `icons.json`). These define what a valid diagram description looks like, and are versioned independently of the renderer/CLI/MCP packages — adding a registry entry (a new sub-layer type, color, or icon) is a deliberate change-request event, not a per-diagram or runtime decision.
- `packages/renderer` — validates an IR document against the schema and registries. The actual layout/rendering engine (IR → SVG) is not implemented yet.
- `packages/cli` — `archsmith validate <file>` works today. `archsmith render` is not implemented yet.
- `packages/mcp-server` — not implemented yet.

## Where this came from

ArchSmith generalizes a hand-tuned Python prototype built and validated in a separate private prototyping repo. Every rendering-mechanics rule here (text wrapping, content-driven box sizing, the gateway icon, outer column frames, a 3-tier width/wrap/acronym decision system, etc.) was discovered and pixel-measured against reference templates there before being ported here as a general-purpose TypeScript implementation.

## Development

```bash
npm install
npm run build
npm test

# Validate an example IR document
node packages/cli/dist/index.js validate examples/minimal-valid.ir.json
```

## License

Apache-2.0
