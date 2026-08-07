# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Copilot, Codex, etc.) working on the [ArchSmith](https://github.com/ayeshLK/archsmith) repository itself.

> **Scope:** this file configures agents contributing to *this* repo. It complements [CONTRIBUTING.md](CONTRIBUTING.md) (the human-facing build/governance doc) rather than replacing it — read both, and don't duplicate one into the other if you're updating them.

## What this is

A renderer, CLI, and MCP server that turn a validated JSON IR (intermediate representation) into an SVG diagram, in one fixed layered/swimlane house style. See [README.md](README.md) for the full pitch and [the IR shape](README.md#the-ir-shape). The short version: `@archsmith/renderer` is a pure function (IR in, SVG out, no LLM call inside it) — interpretation (sketch/description → IR) is deliberately someone else's job, not this repo's.

## Build & test

```bash
npm install
npm run build   # tsc -b across all packages, via project references
npm test        # node's built-in test runner, per package
```

If you touch anything version-sensitive (test runner invocation, glob handling, anything in `package.json` `scripts`), verify across Node 20/22/24 via Docker before trusting it — CI runs that matrix for a reason. A `node --test "dist/**/*.test.js"` glob that worked locally silently broke on Node 20 in exactly this repo (Node 20 doesn't expand CLI glob arguments at all; the eventual fix was `cd dist && node --test` with no path argument):

```bash
for v in 20 22 24; do
  docker run --rm -v "$PWD":/repo -w /repo "node:$v" bash -c "npm ci && npm run build && npm test"
done
```

## The one rule that matters most: registries are governed, not per-diagram

`packages/schema/registries/*.json` define the *only* colors and sub-layer types a diagram may use. Adding an entry is a deliberate, reviewable change-request — never something a generation step or a single diagram's needs decide on the fly. Full model in [CONTRIBUTING.md](CONTRIBUTING.md#the-one-rule-that-matters-most-registries-are-governed-not-per-diagram).

## Renderer conventions

- **Content-driven sizing, always.** Box height/width comes from measuring actual content, never a caller-supplied number.
- **Cursor-then-render, not a separately-derived formula.** Compute height by walking the same step-by-step cursor advance the render pass uses, then read off the final position. A hand-derived formula that isn't provably the same arithmetic as the render loop is the exact bug class this project has repeatedly caught (box heights silently drifting from what's actually drawn).
- **Never `clip-path` for box shapes** — it silently drops rounded corners. Always `<rect rx="..." ry="...">`.
- **Uniform row height** for boxes placed side by side (the row's tallest natural content, via a `minHeight` override), not each box sized to its own content.
- **Nodes are data (`SvgNode[]`), not strings**, until final serialization — this is what makes `render()` safe to call repeatedly from a long-running process (the MCP server), not just a one-shot CLI invocation.
- **Verify a carried-forward constant empirically before trusting it** — don't assume it still applies just because it came from a previous, validated version of the code. `measureText` carried a `*1.07` "correction factor" forward from an earlier prototype for years; it turned out to be compensating for a font-mismatch bug that no longer existed once measurement and rendering shared the same embedded font, and was quietly making every measured width 7% too wide. It was only caught by actually rendering real strings and comparing against a real browser's `getComputedTextLength()`, not by re-reading the code.

## Visual QA is mandatory for rendering changes — the golden master alone is not proof

`packages/renderer/src/render.test.ts` pins an exact-string-match snapshot. That test passing only proves *consistency with itself* — it will happily stay green while pinning a real visual bug, because the golden master was captured *including* the bug. That's exactly what happened earlier in this project: three real rendering defects (borders overlapping, a pill spilling out of its box) shipped and passed every test until a human actually looked at the rendered output.

Before considering a rendering change done:

1. Regenerate the golden master: `node packages/cli/dist/index.js render examples/ticket-booking.ir.json -o examples/ticket-booking.svg`.
2. Actually look at it — serve the repo locally (`python3 -m http.server`) and open the SVG in a browser (or use a browser-automation tool if you have one), or preview it on GitHub. Check specifically for text overflow, overlapping pills, borders coinciding with a parent frame, and misaligned rows — the recurring failure modes here.
3. If you changed something structural (a shared layout constant, a box function used by multiple columns), render a *second*, unrelated fixture too (e.g. `examples/minimal-valid.ir.json`) and check it there as well — a fix that only happens to look right on one example isn't verified as general.
4. Commit the regenerated SVG alongside the code change in the same commit, so a reviewer sees the diff and its visual effect together.

## Never invent content

If an IR is missing something the registry expects (e.g. no Entity Layer), render an honest, visibly-dashed gap note (`gapNoteBox`) — never fabricate a plausible-looking box to fill the space. The same applies to registry values: don't invent a color hex or icon shape ad hoc because a diagram "needs" one; that's a change-request, not a rendering-time decision (a hand-drawn DB-cylinder icon was tried once, exactly this way, and reverted as over-engineering).

## Example content stays fictional and generic

`examples/*.ir.json` should never reference a real company, product, or internal system by name — use plain descriptive names ("Booking Service," "Ticketing Identity Platform") rather than reaching for an invented "cool platform name." This project once had to walk back a supposedly-fictional example name after realizing it was actually lifted from a real internal reference source — the safer default is no invented brand at all, not "as long as it sounds made up."

## Releasing

See [RELEASING.md](RELEASING.md) for the actual step-by-step (it takes two manual workflow runs with a PR merge in between — not obvious from the workflow file alone). The rest of this section is gotchas specific to changing publish-related config, not the normal release flow.

The release workflow (`.github/workflows/release.yml`) runs on `workflow_dispatch` (manual trigger) only, not on every push — publishing is a deliberate action, never a side effect of merging. It's changesets-based (`@changesets/cli`) but the very first release was a manual version bump, not a changeset — changesets only does relative patch/minor/major bumps, not an arbitrary initial version. If you're touching package versions or `publishConfig`, `npm publish --dry-run` per package before trusting it; that caught two real bugs pre-1.0 that would otherwise have shipped silently:

- A `bin` entry with a leading `./` (e.g. `"./dist/index.js"`) gets **silently stripped entirely** by npm's own publish validation — the package would ship with no CLI command at all, no error, no warning short of `npm publish`'s own auto-fix notice. Use a bare path (`"dist/index.js"`).
- A `.npmignore` has **no effect** once `files` is set in `package.json` — `files` takes precedence completely. To exclude something (e.g. compiled `*.test.js`) from a package that also declares `files`, use `!`-prefixed negation globs directly inside the `files` array.
- For a `0.x` package, npm's `^0.1.0` caret range means `>=0.1.0 <0.2.0` — the minor version is pinned pre-1.0. Bumping a package's own version without bumping every internal workspace dependency range that points at it (`^0.1.0` → `^0.5.0`, etc.) will break external installs even though the local workspace (which symlinks packages directly) won't show any problem. The normal changeset-driven flow handles this automatically (verified: a `minor` changeset on `@archsmith/schema` correctly cascaded a `patch` bump + range update to every dependent) — this only bites you if you're editing versions by hand outside that flow.

## Where to look for more

- [README.md](README.md) — what ArchSmith is, the IR shape, how the columns map to concepts, how it compares to Mermaid/PlantUML/Structurizr.
- [CONTRIBUTING.md](CONTRIBUTING.md) — build/test, registry governance in full, code style.
- [packages/schema/README.md](packages/schema/README.md) — the schema/registry files themselves and what's still a placeholder.
- [GitHub issues](https://github.com/ayeshLK/archsmith/issues) (`roadmap`, `schema`, `mcp-server`, `release` labels) — planned work and open directions.
