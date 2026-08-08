# ArchSmith

<p align="center">
  <a href="https://www.npmjs.com/package/@archsmith/cli"><img src="https://img.shields.io/npm/v/@archsmith/cli" alt="npm"></a>
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

> [!NOTE]
> ArchSmith is pre-1.0 — the schema and API may still change (`diagram-schema.json` itself is marked "first pass, expect revision"). See [releases](https://github.com/ayeshLK/archsmith/releases) for what's shipped in each version.

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

## How it compares

Mermaid, PlantUML, and Structurizr (the C4 model's own tool) are the closest comparisons — text/data in, a rendered diagram out, no manual box-dragging. What's different about ArchSmith:

- **One fixed house style, not a general-purpose diagramming language.** Mermaid/PlantUML give you a flexible syntax and largely leave the visual result up to you (or a theme); ArchSmith's IR has no layout or styling knobs at all. The same title/description/color-token input always produces the same box shapes, spacing, and typography, because there's exactly one house style to conform to, not many to choose between.
- **MCP-first, not just a CLI.** The same `render`/`validate` capability is a callable MCP tool, with the schema and registries themselves readable as MCP resources — built for an agent to call as part of a larger workflow, not just for a human to paste into a `.mmd` file.
- **One diagram convention today.** Mermaid/PlantUML/Structurizr all support a broader range of diagram types (sequence diagrams, the full set of C4 levels, state machines) that ArchSmith doesn't attempt yet — see the [`roadmap`-labeled issues](https://github.com/ayeshLK/archsmith/issues?q=is%3Aissue+is%3Aopen+label%3Aroadmap) for where that could go.

If you want a flexible, general-purpose diagramming syntax, Mermaid or PlantUML are probably the better fit. If you want one specific layered-architecture house style enforced consistently across many diagrams — and want an agent to produce them as easily as a human can — that's what ArchSmith is for.

## Quick start

```bash
npm install -g @archsmith/cli

curl -O https://raw.githubusercontent.com/ayeshLK/archsmith/main/examples/ticket-booking.ir.json
archsmith validate ticket-booking.ir.json
archsmith render ticket-booking.ir.json -o ticket-booking.svg
```

Or without installing anything: `npx @archsmith/cli render ticket-booking.ir.json -o ticket-booking.svg`.

Working on ArchSmith itself rather than just using it? See [CONTRIBUTING.md](CONTRIBUTING.md) for building from a clone.

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

To connect it to an MCP host (e.g. Claude Desktop's `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "archsmith": {
      "command": "npx",
      "args": ["-y", "@archsmith/mcp-server"]
    }
  }
}
```

Working from a clone instead (e.g. to test a local change)? Point at the built entrypoint directly:

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

The full schema (`packages/schema/diagram-schema.json`) and governed registries (`packages/schema/registries/`) define every field and every allowed color/sub-layer token — see `packages/schema/README.md` for the governance model. `examples/ticket-booking.ir.json` is a richer, fully-featured reference document, and [`examples/README.md`](examples/README.md) is the gallery index for additional fictional fixtures.

## Packages

This is an npm workspaces monorepo — each package does one job, and only the layer above it knows the layer below exists:

| Package | What it does |
|---|---|
| [`@archsmith/schema`](packages/schema) | The IR schema (JSON Schema draft 2020-12) plus governed registries (sub-layers, colors, icons). Versioned independently — adding a registry entry is a deliberate change-request, not a per-diagram decision. |
| [`@archsmith/renderer`](packages/renderer) | Validates an IR against the schema/registries and renders it to SVG. Pure function, no I/O beyond reading its own bundled font, no LLM dependency. |
| [`@archsmith/cli`](packages/cli) | `archsmith` binary — `validate`, `render`, `registries list\|show`. |
| [`@archsmith/mcp-server`](packages/mcp-server) | `archsmith-mcp` binary — exposes `render`/`validate`/registry lookups over MCP (stdio transport) so any MCP-capable agent can call them as tools. |

## Support

Questions, or something not working the way this README says it should? [Open a GitHub issue](https://github.com/ayeshLK/archsmith/issues) — there's no other support channel yet.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for how to build/test locally and, importantly, the governance rules around changing the schema or registries (this is what keeps the output a consistent house style rather than free-form per-diagram layout). If you're an AI coding agent, see [AGENTS.md](AGENTS.md) too. Planned work and open directions are tracked as [GitHub issues](https://github.com/ayeshLK/archsmith/issues) — [`roadmap`](https://github.com/ayeshLK/archsmith/issues?q=is%3Aissue+is%3Aopen+label%3Aroadmap) for bigger capability directions (new diagram notations, pluggable styles), narrower labels (`schema`, `mcp-server`, `release`) for everything else.

## License

[Apache-2.0](LICENSE)
