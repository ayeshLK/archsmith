# Contributing to ArchSmith

Thanks for considering it. This is a young project — small and opinionated — so there's real room to shape it, but also a few rules worth understanding before you dive in.

If you're an AI coding agent working in this repo, also read [AGENTS.md](AGENTS.md) — it covers agent-specific pitfalls (why the golden-master test alone isn't proof a rendering change is correct, real npm-publish gotchas) that this file doesn't repeat.

## Build & test

```bash
npm install
npm run build   # tsc -b across all packages, via project references
npm test        # Node's built-in test runner, per package
npm run check:examples  # regenerate every gallery SVG and fail on drift
npm run build:pages  # verify and assemble the versioned schema site
```

Each package builds and tests independently (`npm run build --workspace=@archsmith/renderer`, etc.), but `npm run build`/`npm test` from the repo root run all of them via npm workspaces.

CI (`.github/workflows/ci.yml`) runs the same build, test, and gallery verification on Linux across Node 20/22/24 — Linux specifically, not just whatever you developed on, since portability across machines (not just OSes) is the whole reason the renderer measures against a bundled font instead of a system one.

## The one rule that matters most: registries are governed, not per-diagram

`packages/schema/registries/*.json` (sub-layers, colors, icons) define the *only* colors and sub-layer types a diagram is allowed to use. This is deliberate: it's what keeps ArchSmith's output a consistent house style instead of every diagram inventing its own palette. Concretely:

- Adding a new registry entry (a color token, a sub-layer type, an icon) is a real, reviewable change — bump `registryVersion`, explain why the existing set doesn't cover the case, and expect discussion.
- What's *free* per diagram, no review needed: which already-approved tokens a diagram uses, how many rows/items a layer has, which color family is active.
- A PR that adds a registry entry just to unblock one diagram, instead of arguing the entry belongs in the catalog generally, will likely get pushback.

See [`packages/schema/README.md`](packages/schema/README.md) for the full governance model.

Published schemas in `pages/schema/<schemaVersion>/` are immutable. For a schema-version bump, update the canonical schema's `$id`, copy the completed schema into a new versioned directory, and run `npm run build:pages`. The build fails if the current versioned copy differs and generates `schema/latest/` only in the deployment artifact.

## Working on the renderer

A few patterns the existing code leans on hard — new box/layout functions should follow them:

- **Content-driven sizing, always.** A box's height/width comes from measuring its actual content (text, wrapped lines, child rows), never a number the caller supplies and hopes is big enough.
- **Cursor-then-render, not a separately-derived formula.** Compute a box's height by walking the exact same step-by-step cursor advance the render pass uses, then read off the final position — don't hand-derive an algebraic height formula that can silently drift from what's actually drawn. `packages/renderer/src/boxes/itemBox.ts` and `gapNoteBox.ts` are good examples.
- **Never use SVG `clip-path` for box shapes** — it silently drops rounded corners. Use `<rect rx="..." ry="...">` everywhere.
- **Uniform row height.** Boxes placed side by side in a row share the row's tallest natural height (via a `minHeight` override), not each sized to its own content — otherwise rows look misaligned even when each box is individually correct.
- **Nodes are data, not strings.** Every primitive/box function returns an `SvgNode[]` (or `{height, nodes}`); nothing gets serialized to a string until the very end. This is what makes `render()` safe to call repeatedly (e.g. from a long-running MCP server) instead of relying on a shared mutable list.

## Changing rendering output

`packages/renderer/src/render.test.ts` pins an exact-string-match "golden master" (`examples/ticket-booking/diagram.svg`) against `examples/ticket-booking/diagram.archsmith.json`. If your change legitimately alters rendered output:

1. Regenerate it: `node packages/cli/dist/index.js render examples/ticket-booking/diagram.archsmith.json -o examples/ticket-booking/diagram.svg`.
2. Actually look at it before committing — there's no automated visual diff yet. Serve the repo locally (`python3 -m http.server`) and open the SVG in a browser, or preview it directly on GitHub. Check for text overflow, overlapping pills, and misaligned rows specifically — these are the recurring failure modes in this codebase.
3. Commit the regenerated SVG alongside your code change, in the same PR, so a reviewer can see both the diff and its visual effect.

If you move or rename example fixtures under `examples/`, update the matching tests, gallery index, and any README links in the same PR; stale paths will fail CI even if the new diagram renders are correct.

## Working on the MCP server

`packages/mcp-server/src/server.ts` builds the `McpServer` instance (tools, resources); `index.ts` is a thin entrypoint that connects it to `StdioServerTransport` and runs. Keep that split — it's what lets `server.test.ts` connect a real MCP `Client` to the server over an in-memory transport pair and exercise the actual protocol (tool schemas, argument parsing, content-block shapes), instead of only unit-testing handler functions directly.

**Never write to stdout.** `StdioServerTransport` uses stdout as the JSON-RPC channel — a stray `console.log` (even for debugging) corrupts the protocol stream from the client's point of view. Use `console.error` (stderr) for any diagnostics.

## Code style

- TypeScript, ESM (`"type": "module"`) throughout, `tsc -b` project references — no bundler.
- No comments explaining *what* code does (names should do that); a short comment is fine when it explains a non-obvious *why* (a pixel-measured constant, a workaround, an invariant that would surprise a reader).
- Don't add error handling, fallbacks, or abstractions for cases that can't happen. Prefer three similar lines over a premature helper.

## Releasing

If your PR changes something version-worthy in a published package, add a changeset: `npx changeset add`. Cutting an actual release (npm publish rights required) is documented in [RELEASING.md](RELEASING.md).

## Reporting issues

Open a GitHub issue. For a rendering bug, a minimal reproducing IR document (trim it down — don't paste your whole diagram) makes it much faster to fix.
