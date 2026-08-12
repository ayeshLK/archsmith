# Agent-authored architecture diagram

This is the inspectable source of truth for a real ArchSmith dogfood run:

> plain-English requirement → live MCP discovery → clarification → agent-authored IR → validation → rendering → published-action CI

The architecture is fictional and generic. ArchSmith did not call a model: Claude Code performed the interpretation and called the published ArchSmith MCP server; ArchSmith remained the deterministic validator and renderer.

## Artifacts

- [`requirement.md`](./requirement.md) — the original plain-English input, before any IR existed.
- [`clarifications.md`](./clarifications.md) — the agent's schema-grounded questions, user answers, and human review.
- [`mcp-config.json`](./mcp-config.json) — the published MCP server configuration used for the recording.
- [`tool-sequence.json`](./tool-sequence.json) — privacy-reviewed structured evidence of discovery, validation, correction, and rendering calls.
- [`diagram.archsmith.json`](./diagram.archsmith.json) — the final agent-authored, human-reviewed IR.
- [`diagram.svg`](./diagram.svg) — deterministic output rendered from that IR.
- [Consumer workflow](../../.github/workflows/agent-authored-architecture-diagram.yml) — installs the published CLI with `ayeshLK/setup-archsmith@v0`, asserts its version and PATH availability, validates and renders the IR, compares the render with the committed SVG, and uploads it.

## Recorded environment

| Component | Recorded value |
|---|---|
| Date | 2026-08-12 |
| Host | Claude Code 2.1.227 |
| Model | `claude-haiku-4-5-20251001` |
| MCP package | `@archsmith/mcp-server@0.6.1` |
| Schema | `0.3.0` |
| CI action | `ayeshLK/setup-archsmith@v0` |
| CI CLI version | `@archsmith/cli@0.6.0` |

The model and host identify this recording, not an ArchSmith runtime dependency or a claim about every MCP client. This is a resync of an earlier recording made against `@archsmith/mcp-server@0.6.0`, which predated the compact response default fixed by issue #50 and required deliberately passing `embedFonts: false` to `render` to avoid an oversized MCP response. On `0.6.1`, `render` was called with `embedFonts` omitted entirely and returned a single compact text block with no embedded font — no workaround needed. The committed `diagram.svg` is then regenerated with the published CLI's default embedded fonts for a self-contained browser artifact; CI reproduces and compares that CLI output byte for byte.

## Reproduce the authoring flow

1. Start an MCP-capable host with [`mcp-config.json`](./mcp-config.json). For Claude Code:

   ```bash
   claude --mcp-config examples/agent-authored-architecture-diagram/mcp-config.json --strict-mcp-config
   ```

2. Give the agent [`requirement.md`](./requirement.md) and require it to call `get_schema`, `list_registries`, and the relevant `get_registry` tools before drafting.
3. Preserve its questions and answer them. The recorded answers are in [`clarifications.md`](./clarifications.md).
4. Ask it to author an IR, call `validate`, correct every error, and call `render` — omit `embedFonts` and the compact default applies automatically on MCP `0.6.1`+.
5. Review the architecture for invented content, not merely schema validity — schema-valid is not the same as truthful to the requirement. The recorded first draft in this round needed no corrections; [`clarifications.md`](./clarifications.md) documents why, including the fabrication traps an earlier round caught.
6. Save the final IR as `diagram.archsmith.json` and render it to `diagram.svg`.

A newer host or model may ask different questions or produce a semantically equivalent IR rather than this exact JSON. Model interpretation is not deterministic. ArchSmith's guarantee begins once the IR is fixed: identical IR, renderer version, and options produce identical SVG.

## Reproduce the architecture-as-code check

The consumer workflow runs manually and every Monday. Locally, the equivalent published-CLI commands are:

```bash
npx -y @archsmith/cli@0.6.0 validate examples/agent-authored-architecture-diagram/diagram.archsmith.json
npx -y @archsmith/cli@0.6.0 render examples/agent-authored-architecture-diagram/diagram.archsmith.json -o /tmp/agent-authored-architecture-diagram.svg
cmp examples/agent-authored-architecture-diagram/diagram.svg /tmp/agent-authored-architecture-diagram.svg
```

CI renders into the runner's temporary directory and uploads the SVG; it never commits generated files or opens a pull request.

## Evidence and privacy

The recording used controlled prompts containing only the fictional requirement and answers in this folder. [`tool-sequence.json`](./tool-sequence.json) retains the actual operation order, timestamps, selected non-sensitive arguments, and final results. It excludes credentials, authentication metadata, absolute host paths, system prompts, hidden reasoning, token accounting, the large schema/registry/SVG bodies, and a couple of local recording-environment retries (a cold-npx-cache MCP connection failure, a client-side generation timeout) that reflect this recording setup rather than the agent's authoring behavior. No raw general-purpose session log is committed.
