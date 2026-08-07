# ArchSmith

<p align="center">
  <a href="https://github.com/ayeshLK/archsmith/actions/workflows/ci.yml"><img src="https://github.com/ayeshLK/archsmith/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/ayeshLK/archsmith/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ayeshLK/archsmith" alt="License"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node >= 20">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome">
</p>

**ArchSmith turns a validated JSON description of a layered system architecture into a clean, consistent SVG diagram.** Feed it a structured document (an IR — intermediate representation), get back a diagram in a fixed, opinionated house style: no per-diagram layout decisions, no hand-drawn boxes, no drift between one architecture doc and the next.

It's built as a library first, a CLI on top of that, and an MCP server on top of that — so it's just as easy for a human to run `archsmith render` as it is for an AI agent to call it as a tool.

<p align="center">
  <img src="examples/ticket-booking.svg" alt="Example architecture diagram rendered by ArchSmith" width="900">
</p>

<p align="center"><sub>Rendered from <a href="examples/ticket-booking.ir.json"><code>examples/ticket-booking.ir.json</code></a> — a fictional example exercising every schema feature.</sub></p>

## Why

Drawing an architecture diagram by hand is slow and doesn't scale: every new diagram means re-deciding box shapes, colors, spacing, and layout from scratch, and keeping a whole set of diagrams visually consistent — a real "house style" — is a losing battle once more than one person is producing them. It's harder still now that agents, not just humans, increasingly need to produce these diagrams: an agent can't open a drawing tool and drag boxes around, but it can absolutely produce structured JSON.

Just asking an LLM to draw an SVG diagram directly doesn't fix this either — it trades manual inconsistency for a different kind, where the same request can come out looking different depending on the day, the model, or the prompt. ArchSmith separates those two concerns instead: an agent (or a human) does the *interpretation* — turning a sketch or a description into a valid structured document — and hands it to ArchSmith for deterministic rendering. Same input, same output, every time, with the house style (spacing, colors, text wrapping, box shapes) enforced by the renderer rather than re-decided per diagram — down to embedding the exact font text was measured against, so a diagram looks the same on any machine viewing it, not just the one that rendered it.

## How

ArchSmith currently supports one diagram convention: a layered/swimlane style that lays out a system's architecture as five columns, left to right:

1. **Inbound Actors** — who or what calls into the system (end users, other apps, partner integrations).
2. **Ingress** — the API gateway/edge layer requests come in through.
3. **Core Platform** — the backend itself: API-management/identity concerns, the actual business-logic services, an optional domain-model layer, and the platform's own databases/files ("Systems of Record").
4. **Egress** — the gateway layer through which the platform calls *out* to other systems.
5. **External Systems** — downstream dependencies reached via egress, grouped into named clusters.

Every color, box shape, spacing rule, and text-wrapping decision in that layout was pixel-measured against real reference diagrams, not guessed — see [`packages/schema/README.md`](packages/schema/README.md) for how the sub-layer/color palette is governed as it grows.

Describing an architecture is just picking what goes in each column and writing it down: a title, a short description, and — for items with a role worth flagging, like "the primary database" or "only reached via egress" — a colored dot or a small pill tag. No coordinates, no manual layout, no font-size or spacing decisions to make; the renderer works out box sizes, text wrapping, and alignment from the content alone. See [the IR shape](#the-ir-shape) below for the actual JSON structure, and [Quick start](#quick-start) to render one.

## Quick start

```bash
git clone https://github.com/ayeshLK/archsmith.git
cd archsmith
npm install
npm run build

npx archsmith validate examples/ticket-booking.ir.json
npx archsmith render examples/ticket-booking.ir.json -o ticket-booking.svg
```

(Not yet published to npm — see [issues labeled `release`](https://github.com/ayeshLK/archsmith/issues?q=is%3Aissue+is%3Aopen+label%3Arelease) — so for now this only works from a clone, via the workspace-linked `archsmith` bin.)

## CLI usage

```bash
archsmith validate <input.json> [--json]
archsmith render <input.json> -o <out.svg> [--no-embed-fonts] [--pretty]
archsmith registries list
archsmith registries show <sub-layers|colors|icons> [--family standard|accessible]
```

- `render` validates the IR first and fails the same way `validate` would (exit 1) if it's invalid; a rendering-time error exits 2.
- `--no-embed-fonts` skips embedding the bundled font, producing a smaller file.
- `--pretty` indents the output SVG's element lines for readability (default is one element per line, unindented).
- `registries show colors --family standard` prints just that color family instead of the whole registry.

## Using it as a library

```ts
import { render, validate } from "@archsmith/renderer";

const result = validate(ir); // { valid: boolean, errors: string[] }
if (result.valid) {
  const svg = render(ir); // complete SVG document, as a string
}
```

## MCP server

`@archsmith/mcp-server` exposes the same capability as the CLI, over MCP instead of argv — a sibling of the CLI, not a wrapper around it: both call `render()`/`validate()` from `@archsmith/renderer` directly. It communicates over stdio, so an MCP host spawns it as a subprocess and talks JSON-RPC over stdin/stdout, the same way a shell would spawn `archsmith` and read its stdout — except the process stays alive across many calls instead of exiting after one.

**Tools**: `render`, `validate`, `list_registries`, `get_registry` (mirrors the CLI's own commands — same validate-before-render behavior, same `family` filter on `get_registry`). `render` returns the SVG as both plain text and an `image/svg+xml` content block, so a client that renders arbitrary image mime types can show the diagram inline.

**Resources**: `archsmith://schema` and one `archsmith://registries/<name>` per governed registry — lets an agent authoring an IR read the live, current schema/registries directly instead of working from a stale copy baked into a prompt.

To connect it to an MCP host (e.g. Claude Desktop's `claude_desktop_config.json`), point at the built entrypoint:

```json
{
  "mcpServers": {
    "archsmith": {
      "command": "node",
      "args": ["/absolute/path/to/archsmith/packages/mcp-server/dist/index.js"]
    }
  }
}
```

## The IR shape

An IR document is a JSON object with five columns, a legend, and optional notes. This is the actual minimal valid fixture from `examples/`:

```json
{
  "schemaVersion": "0.2.0",
  "title": "Minimal Example — Architecture",
  "subtitle": "A minimal fixture proving the validation pipeline end to end",
  "colorTheme": { "family": "standard" },
  "columns": {
    "inboundActors": {
      "items": [
        { "title": "Web App", "dotColor": "purple", "descriptionLines": ["React SPA"] }
      ]
    },
    "ingress": { "gateway": { "label": "API Gateway", "sublabel": "Production Runtime" } },
    "corePlatform": {
      "deployedOn": "Production Runtime",
      "subLayers": [
        { "registryId": "execution-and-capability", "rows": [[{ "title": "Backend Service", "descriptionLines": ["REST APIs"] }]] }
      ],
      "systemsOfRecord": { "items": [{ "title": "Primary DB", "descriptionLines": ["PostgreSQL"] }] }
    },
    "egress": { "gateway": { "label": "API Gateway", "sublabel": "Outbound M2M" } },
    "externalSystems": {
      "clusters": [
        { "name": "Shared Internal Services", "items": [{ "title": "Email Service", "dotColor": "teal", "descriptionLines": ["Notifications"] }] }
      ]
    }
  },
  "legend": { "entries": [{ "colorToken": "green", "label": "Execution and Capability Layer" }] }
}
```

The full schema (`packages/schema/diagram-schema.json`) and governed registries (`packages/schema/registries/`) define every field and every allowed color/sub-layer token — see `packages/schema/README.md` for the governance model. `examples/ticket-booking.ir.json` is a richer, fully-featured reference document.

## Packages

This is an npm workspaces monorepo — each package does one job, and only the layer above it knows the layer below exists:

| Package | What it does |
|---|---|
| [`@archsmith/schema`](packages/schema) | The IR schema (JSON Schema draft 2020-12) plus governed registries (sub-layers, colors, icons). Versioned independently — adding a registry entry is a deliberate change-request, not a per-diagram decision. |
| [`@archsmith/renderer`](packages/renderer) | Validates an IR against the schema/registries and renders it to SVG. Pure function, no I/O beyond reading its own bundled font, no LLM dependency. |
| [`@archsmith/cli`](packages/cli) | `archsmith` binary — `validate`, `render`, `registries list\|show`. |
| [`@archsmith/mcp-server`](packages/mcp-server) | `archsmith-mcp` binary — exposes `render`/`validate`/registry lookups over MCP (stdio transport) so any MCP-capable agent can call them as tools. |

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for how to build/test locally and, importantly, the governance rules around changing the schema or registries (this is what keeps the output a consistent house style rather than free-form per-diagram layout). Planned work and open directions are tracked as [GitHub issues](https://github.com/ayeshLK/archsmith/issues) — [`roadmap`](https://github.com/ayeshLK/archsmith/issues?q=is%3Aissue+is%3Aopen+label%3Aroadmap) for bigger capability directions (new diagram notations, pluggable styles), narrower labels (`schema`, `mcp-server`, `release`) for everything else.

## License

[Apache-2.0](LICENSE)
