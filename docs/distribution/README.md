# ArchSmith distribution listing kit

Use this directory when submitting ArchSmith to MCP registries, client marketplaces, and curated tool lists. It keeps the public description and install command consistent without making an external directory the source of truth.

[`packages/mcp-server/server.json`](../../packages/mcp-server/server.json) remains authoritative for the current package version and official MCP Registry metadata. Never copy its version into a manual listing unless the destination requires one; prefer a package or registry identifier that follows future releases automatically.

## Reusable asset

[`archsmith-icon.svg`](archsmith-icon.svg) is the editable square marketplace icon. [`archsmith-icon.png`](archsmith-icon.png) is its opaque 400×400 raster export. They use the same five-column architecture motif and standard governed palette as the repository's [social preview](../social-preview/README.md), contain no external image or font dependency, and remain legible when reduced to a small catalog tile.

Prefer the SVG wherever the destination accepts it. Use the PNG when it requires a 400×400 raster upload. For any other required dimensions, export the SVG to that exact square size and inspect the result before submission; do not stretch or crop the landscape social preview into a square.

## Canonical identity

| Field | Value |
| --- | --- |
| Name | ArchSmith |
| Repository | `https://github.com/ayeshLK/archsmith` |
| Homepage | `https://github.com/ayeshLK/archsmith` |
| Official Registry name | `io.github.ayeshLK/archsmith` |
| npm package | `@archsmith/mcp-server` |
| Transport | Local `stdio` |
| License | MIT |
| Language | TypeScript |
| Provider / author | Ayesh Almeida (`https://github.com/ayeshLK`) |

### Tagline

> Render and validate consistent SVG architecture diagrams from a governed JSON IR.

### Directory description

> ArchSmith is a deterministic architecture-diagram renderer. Its MCP server lets agents read the live schema and governed registries, validate diagram IR, and render SVG without embedding an LLM or exposing per-diagram styling controls.

### Concise catalog entry

> MCP server for validating governed ArchSmith JSON IR and rendering deterministic SVG architecture diagrams.

### Suggested classifications

- General category: Developer Tools
- Secondary category: Design & Creative
- Cline tags: `software`, `creative`
- mcpHQ category: `developer-tools-and-code-intelligence`
- General tags: `architecture`, `diagrams`, `svg`, `validation`, `developer-tools`

## Installation

The server needs no credentials or environment variables. A generic MCP client configuration is:

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

For directories that store a shell-style command, use:

```sh
npx -y @archsmith/mcp-server
```

## Ready-to-copy marketplace records

The current Cline marketplace accepts an optional local icon and models a stdio installation as the tokens after `cline mcp install`:

```json
{
  "$schema": "../../../schemas/mcp.schema.json",
  "id": "archsmith",
  "type": "mcp",
  "name": "ArchSmith",
  "tagline": "Render and validate consistent SVG architecture diagrams from a governed JSON IR.",
  "description": "ArchSmith is a deterministic architecture-diagram renderer. Its MCP server lets agents read the live schema and governed registries, validate diagram IR, and render SVG without embedding an LLM or exposing per-diagram styling controls.",
  "author": {
    "name": "Ayesh Almeida",
    "url": "https://github.com/ayeshLK"
  },
  "homepage": "https://github.com/ayeshLK/archsmith",
  "repo": "https://github.com/ayeshLK/archsmith",
  "icon": "./icon.svg",
  "tags": ["software", "creative"],
  "license": "MIT",
  "verified": false,
  "featured": false,
  "install": {
    "args": ["archsmith", "--", "npx", "-y", "@archsmith/mcp-server"]
  }
}
```

The current mcpHQ catalog record is:

```json
{
  "name": "ArchSmith",
  "url": "https://github.com/ayeshLK/archsmith",
  "description": "MCP server for validating governed ArchSmith JSON IR and rendering deterministic SVG architecture diagrams.",
  "category": "developer-tools-and-code-intelligence",
  "language": "TypeScript",
  "provider": "ArchSmith",
  "tags": ["architecture", "diagrams", "svg", "validation"],
  "official": true
}
```

External schemas and accepted tags can change. Re-read the destination's contribution guide and validate against its current checkout before opening a submission; these records are starting points, not a substitute for the destination's checks.

## Submission checks

Before submitting a listing:

1. Search the destination for both `ArchSmith` and `ayeshLK/archsmith` to avoid a duplicate.
2. Confirm the destination accepts local npm/stdio servers. Do not describe ArchSmith as remotely hosted.
3. Use the repository URL as the primary project link and the official Registry name or npm package as the install source.
4. Keep the renderer's boundary explicit: the connected agent interprets a request, while ArchSmith deterministically validates and renders the supplied IR.
5. Do not claim support for diagram types, icons, transports, or authoring modes that have not shipped.
6. Run the destination's validation or preview workflow and test its generated install command in a clean environment.
7. Record the submitted URL on the relevant ArchSmith tracking issue.
