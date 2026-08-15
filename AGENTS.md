# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Copilot, Codex, etc.) working on the [ArchSmith](https://github.com/ayeshLK/archsmith) repository itself.

> **Scope:** this file configures agents contributing to *this* repo. It complements [CONTRIBUTING.md](CONTRIBUTING.md) (the human-facing build/governance doc) rather than replacing it — read both, and don't duplicate one into the other if you're updating them.

## What this is

A renderer, CLI, and MCP server that turn a validated JSON IR (intermediate representation) into an SVG diagram, in one fixed layered/swimlane house style. See [README.md](README.md) for the full pitch and [the IR shape](README.md#the-ir-shape). The short version: `@archsmith/renderer` is a pure function (IR in, SVG out, no LLM call inside it) — interpretation (sketch/description → IR) is deliberately someone else's job, not this repo's.

## Architecture at a glance

npm workspaces monorepo. Four packages, strict one-way dependency chain — each package only knows about the one directly below it:

```
@archsmith/cli  ─┐
                 ├──▶ @archsmith/renderer ──▶ @archsmith/schema
@archsmith/mcp-server  ─┘
```

- `packages/schema` — the JSON Schema (`diagram-schema.json`) plus governed registries (`registries/{colors,icons,sub-layers}.json`). Registry entries are house-style contracts, not per-diagram decisions.
- `packages/renderer` — pure function: validated IR in, SVG string out. No I/O beyond reading its own bundled font. No LLM call anywhere inside it. Layout is organized as `layout/` (per-column assembly), `boxes/` (individual shapes), `text/` (font measurement + wrapping via the embedded Arimo font, using `fontkit`), and `svg/` (node model + serialization + font embedding). TypeScript project references (`tsc -b`) handle inter-package build order — no manual ordering needed.
- `packages/cli` — the `archsmith` binary. Thin `commander`-based wrapper around `render()` / `validate()`. `render` exits 1 on validation errors, 2 on rendering errors. Also has the `author` subcommand, an interactive Ink-based wizard — see [`archsmith author`](#archsmith-author--interactive-authoring-wizard-issue-67), below.
- `packages/mcp-server` — the `archsmith-mcp` binary. A **sibling** of the CLI, not a wrapper: calls `render()` / `validate()` from `@archsmith/renderer` directly. `server.ts` builds the `McpServer` while `index.ts` is a thin entrypoint that wires it to `StdioServerTransport`; the split exists so `server.test.ts` can connect a real MCP `Client` over an in-memory transport pair. **Never write to stdout** — stdout is the JSON-RPC channel and a stray `console.log` (even for debugging) corrupts the protocol stream. Use `console.error` for diagnostics.

## Build & test

```bash
npm install
npm run build   # tsc -b across all packages, via project references
npm test        # Node's built-in test runner, per package
npm run check:examples  # regenerate every gallery SVG and fail on drift
npm run build:pages  # verify and assemble the versioned schema site
npm run security:audit  # fail on high/critical production dependency advisories
```

If you touch anything version-sensitive (test runner invocation, glob handling, anything in `package.json` `scripts`), verify across Node 20/22/24 via Docker before trusting it — CI runs that matrix for a reason. A `node --test "dist/**/*.test.js"` glob that worked locally silently broke on Node 20 in exactly this repo (Node 20 doesn't expand CLI glob arguments at all; the eventual fix was `cd dist && node --test` with no path argument):

```bash
for v in 20 22 24; do
  docker run --rm -v "$PWD":/repo -w /repo "node:$v" bash -c "npm ci && npm run build && npm test && npm run check:examples"
done
```

Running a **single test file** — `node --test` doesn't accept a source-tree path, so build the package first and invoke Node's test runner against the compiled file inside `dist/`:

```bash
npm run build --workspace=@archsmith/renderer
node --test packages/renderer/dist/text/wrap.test.js
```

`npm run lint` is wired up at the root (`--workspaces --if-present`) but no package currently implements a `lint` script — it's a no-op today, not a broken linter.

## The one rule that matters most: registries are governed, not per-diagram

`packages/schema/registries/*.json` define the *only* colors and sub-layer types a diagram may use. Adding an entry is a deliberate, reviewable change-request — never something a generation step or a single diagram's needs decide on the fly. Full model in [CONTRIBUTING.md](CONTRIBUTING.md#the-one-rule-that-matters-most-registries-are-governed-not-per-diagram).

Published schemas under `pages/schema/<schemaVersion>/` are immutable archives. When bumping `schemaVersion`, add the new schema at its versioned path and update `$id`; never overwrite an older version. `npm run build:pages` verifies the current archive and generates the floating `schema/latest/` copy.

## Active proposal handoff

These proposals have been discussed with the maintainer but are not blanket authorization to start implementation. Read the linked issue first and preserve the decisions below when work resumes.

### Icon registry and rendering — issue [#6](https://github.com/ayeshLK/archsmith/issues/6)

- The agreed scope is end-to-end icon support: governed registry data, semantic validation, rendering, tests, documentation, licensing, and migration of every valid example.
- Icon sources must be Apache-2.0 only. Vendor the small approved geometry subset; do not add a runtime icon dependency. Use one external visual system as the baseline and add original Apache-2.0 ArchSmith icons only where that system has no suitable match.
- Initial semantic tokens are `actor`, `governance`, `service`, `entity`, `data-store`, and `external`. Keep the gateway's existing renderer-specific glyph. Warning remains a pill/status concern, not an item icon or overlay in this issue.
- `item.icon` stays explicit — never infer it from a title, column, sub-layer, or pill. Actor/external icons replace their existing dot; a missing icon retains that dot. Core items show an icon only when explicitly supplied; iconless core items stay marker-free so existing layouts remain compatible.
- Geometry is color-free and normalized to a 24×24 monochrome outline language for rendering around 16×16. Actor/external icons use the item's `dotColor`; core icons use their containing layer accent.
- Before production implementation, compare Apache-2.0 candidates and original alternatives in an SVG gallery and obtain explicit design approval. Prototype the approved design on `ticket-booking` first, then migrate, regenerate, and visually inspect every example before completion. The full proposal is recorded in the issue comment.

### Workflow diagram support — issue [#49](https://github.com/ayeshLK/archsmith/issues/49) (philosophical scoping in [#1](https://github.com/ayeshLK/archsmith/issues/1#issuecomment-5250173885))

- ArchSmith's target diagram types are architecture (existing), workflow, and sequence — one fixed house style per type, never a choice of notation within a type. C4 was explicitly rejected on this principle: it would be a second answer to a question (how do we draw an architecture diagram) ArchSmith already answers, not a new type.
- The workflow IR is a single edge-free, recursive `Step` union (`terminal | process | decision | loop | break | parallel`). Branches and loop bodies are always local containment (nested `Step[]`), never graph edges/references — this is the invariant to preserve above all others, since it's what keeps branch/loop layout a bounded, local geometry problem instead of reopening general graph routing.
- v1 ships terminal, process, decision, loop, and break. `loop`/`break` were originally proposed as a fast-follow, then pulled forward once their design showed the incremental cost was low (reuses an ordinary sequential stack, no new layout primitive needed). `parallel` was also pulled forward at the same point, but has since been re-deferred to a fast-follow after v1 — its IR and connector geometry (the fork/join bar) are fully designed and recorded in the #49 comments, just not scheduled for the initial release.
- No swimlanes, no sub-process nesting, no input/output (parallelogram) shape, decisions capped at exactly 2 branches — deferred/dropped, validated against representative technical/ops use cases (CI/CD, incident response, request-handling, approval flow) rather than by difficulty alone.
- No new governed registry needed for step kinds. Unlike sub-layers (many categories sharing one shape, needing color to differentiate), workflow step types are already visually distinct by shape — each gets its own bespoke rendering function, the same pattern as `gatewayBox.ts`/`clusterBox.ts`/`actorBox.ts` today.
- The top-level IR drops `colorTheme`, `legend`, and `unclassified` relative to today's architecture schema (none have a workflow analog) and adds a required `kind: "workflow"` discriminator (no default — an optional/defaulted `kind` produces misleading validation errors, see #49) and `flow: Step[]` in place of `columns`.
- Depends on a not-yet-built `kind`-pluggable schema/renderer/CLI/MCP seam (also needed for sequence diagrams). Full IR design and reasoning live in the #49 comments, not duplicated here.

## `archsmith author` — interactive authoring wizard (issue [#67](https://github.com/ayeshLK/archsmith/issues/67))

A guided, deterministic CLI wizard that walks a first-time or occasional author through building a valid *initial* diagram IR one decision at a time — no hand-written JSON, no LLM, every governed field (sub-layer, color, `registryId`) offered as a live pick-list so whole classes of validation error can't occur. It's a distinct, independently-justified path from the LLM-authoring question in #3: a live test there measured an agent inventing unstated structure (a fabricated Entity Layer, a dashboard modeled as a service) that a human answering the same pick-lists wouldn't. Full positioning, the experience-review discussion that shaped v1 scope, and the field-descriptor mechanism design are recorded in the issue and its comments — read them before changing the wizard's shape, not just this summary.

Delivery is phased, each phase/screen shipped as its own small PR with its own changeset, full monorepo `build`/`test`/`check:examples` before every commit:

- **Phase 1** (done) — the field/section descriptor spec (`FieldDescriptor<T>`) and the authoring glossary (`packages/schema/registries/authoring-glossary.json`, distinct from the governed registries — descriptive copy, never validated).
- **Phase 2** (done) — `assemble(draft): DiagramIR`, the headless draft→IR engine.
- **Phase 3** (done) — the Ink UI, every `SECTION_ORDER` section: intro, Inbound Actors, Ingress, Core Platform (3 governed sub-layers, then Systems of Record), Egress, External Systems, Review (with jump-to-correct for the 3 scalar-only sections), and the final validate/render/save step. `App.tsx` has no more "not yet built" fallback — every reachable state has a real screen.
- **Phase 4** (not started) — testing and real-user validation (the issue's own recommendation: test with someone unfamiliar with ArchSmith, someone who already hand-authors diagrams, and one intentionally ambiguous architecture, before freezing the flow).
- **Phase 5** (not started) — ship.

Editing an existing diagram and resuming a draft across a closed terminal (the issue's "Phase 1.5") are bundled together as one deferred problem, not built speculatively now.

### Where the code lives

`packages/cli/src/author/`: `draftIr.ts` (`DraftIR`, a hand-written, deliberately partial mirror of `DiagramIR` — matching `ir.ts`'s own hand-written-not-code-generated convention), `fieldDescriptor.ts` (`FieldDescriptor<T>`, `SectionStatus`), `itemLens.ts` (the item-lens factory + its accessors), `derived.ts` (pure functions over the draft: legend entries, abbreviations, the governed sub-layer list via `governedCoreSubLayers()`), `gapResolution.ts` (the three-state derivation, plus `subLayerGapNote()` for reading back the actual reason text), `rowGrouping.ts` (the row-pairing suggestion), `scalarDescriptors.ts`, `authoringNotes.ts`, `assemble.ts`, `navigation.ts` (`SECTION_ORDER`, `advance`, `jumpTo`), and `screens/` — one Ink component per section (`IntroScreen`, `InboundActorsScreen`, `GatewayScreen` shared by Ingress/Egress, `CorePlatformSubLayersScreen`, `SystemsOfRecordScreen`, `ExternalSystemsScreen`, `ReviewScreen`, `FinalStepScreen`, plus the shared `ItemSubFlow`) — with `App.tsx`/`cli.tsx` wiring them together and `App.test.tsx` covering the navigation wiring itself (jump-to-correct's round trip, the corePlatform two-sub-screen split) end to end, not just each screen in isolation.

### Architecture invariants

- **`FieldDescriptor.write()` must merge onto the existing draft, never reconstruct it** — a sibling field the descriptor doesn't model (e.g. a v1.1 field like `pill`/`tagOverride` already present from a loaded file) has to survive untouched.
- **One item-lens factory (`itemLens()`), instantiated at every real anchor point** — Inbound Actors, Systems of Record, a cluster's items, a sub-layer's flattened items — never a copy-pasted descriptor set per column. Same reasoning as `gatewayLens()` for Ingress/Egress.
- **Three-state gap resolution (done/absent/pending) is derived purely from draft shape** — no separate "pending" flag is ever stored. "Not sure yet" and "come back to this later" are the same underlying state (`gapResolution.ts`'s `subLayerStatus`), differing only in prompt copy.
- **Row grouping is a real v1 feature, checked against actual examples** (6/6 diagrams with an Execution & Capability layer pair items into shared rows), not assumed — `suggestRowGrouping()` proposes a sequential pairing; `unflattenPreservingShape()` preserves an existing row shape when an edit doesn't change the item count, and only falls back to one-item-per-row when it does (a real layout change, not something to guess a pairing for). Not yet wired into any screen — every repeatable-list screen still falls back to one-item-per-row today.
- **`assemble()` doesn't duplicate `validate()`'s own structural checks** (e.g. `minItems: 1` on `inboundActors.items`, `corePlatform.subLayers`, `systemsOfRecord.items`, `externalSystems.clusters`) — confirmed against the live schema, not assumed, then deliberately left to `validate()` alone. `assemble()` only throws directly for a required *scalar* with no sensible default (title, subtitle, a gateway's label), naming exactly which field is unanswered. `FinalStepScreen` is the only screen that actually calls it.
- **`navigation.ts`'s `SECTION_ORDER` is a suggested default, not an enforced sequence.** `jumpTo` is genuinely used now — Review's "edit" options jump back into Title/Subtitle/Deployed On, Ingress, or Egress, and `App.tsx` tracks a `cameFromReview` flag so completing one of those returns to Review (via `jumpTo(nav, "review")`) instead of continuing forward through `advance()`'s normal sequence.
- **Jump-to-correct only exists for the 3 scalar-only sections, not the 4 repeatable-list ones.** `InboundActorsScreen`, `CorePlatformSubLayersScreen`, `SystemsOfRecordScreen`, and `ExternalSystemsScreen` all start their internal item-index state at 0 unconditionally — none support re-entering an already-populated list in "append mode." Jumping back into one today would restart it from item 1, silently overwriting what's already there. This is the exact same problem as the nested "resume cursor" below and is deferred for the same reason, not built speculatively ahead of a real need.
- **The nested "resume cursor"** (jumping back into an already-finished repeatable list in append mode, then returning to exactly where you left off — distinct from the whole-section jump above) **is intentionally not designed yet** — build it only once a real multi-step screen exists whose shape it needs to match, not speculatively ahead of one.
- **A screen that can be re-entered with existing draft data must seed its inputs from that data, not always start blank.** `IntroScreen`/`GatewayScreen` only needed this once Review's jump-to-correct made re-entry possible — every earlier screen was only ever entered once, on an empty draft, so this wasn't a real failure mode until then. If a future screen becomes jump-to-correct-able, check whether it needs the same fix before assuming it's fine.
- **`FinalStepScreen` never overwrites an existing file silently** — it checks both target paths with `existsSync` before writing and requires an explicit "Overwrite" confirmation on conflict, per issue #67's own explicit requirement. Its save directory is an overridable `cwd` prop (defaulting to `process.cwd()`) specifically so tests can point writes at a real temp directory instead of mocking `node:fs`.

### Ink-specific pitfalls

- **`ink-form` is stale, despite issue #67's own text assuming it for grouped multi-field steps** — last published 2024-05-18, peer dependency `ink>=4` against this repo's `ink@7`. Verified via `npm view` before writing any UI code, not assumed from the issue text. Grouped multi-field screens (e.g. `ItemSubFlow.tsx`'s title → eyebrow → description lines → color sequence) are hand-built from `ink-select-input`/`ink-text-input` instead. Re-check this if a future screen is tempted to reach for `ink-form` again.
- **`ink-select-input`'s highlighted-option cursor is internal component state that survives a re-render unless the component is remounted.** Re-showing what looks like the same prompt for the next step in a loop (e.g. `CorePlatformSubLayersScreen`'s decide prompt, once per sub-layer) silently inherits the previous step's cursor position if the `SelectInput` isn't given a `key` that changes per step (the current item/layer index). This was caught by a component test actually asserting on the resulting draft, not by inspection — write a test that walks more than one repetition of any loop containing a `SelectInput`.
- **Ctrl+C needs explicit handling via `useInput`** (`key.ctrl && input === "c"`) — Ink's raw mode intercepts the normal SIGINT delivery.
- **Testing with `ink-testing-library`:** rapid synchronous `stdin.write()` calls race ahead of React's own state updates. Make test helpers `async` and `await setImmediate()` (from `node:timers/promises`) between each write — see any `screens/*.test.tsx` file for the pattern.
- **A down-arrow keystroke in a test must contain a real `ESC` byte, not the literal two characters `"[B"`.** Typing the escape sequence directly into a string literal has silently produced a version *without* the actual `ESC` control character more than once in this project — the test then compiles and runs but every `SelectInput` selection silently no-ops (the highlighted option never moves), which reads as a confusing, unrelated test failure rather than an obviously-wrong keystroke. Build it as `String.fromCharCode(27) + "[B"` (or verify the literal's bytes with `od -c` before trusting it) rather than typing the raw escape character and hoping it survived.
- **A test helper wrapping an `async` callback must itself be `async` and `await` that callback before any cleanup runs.** A `withTempDir(fn)`-style helper that calls `fn(dir)` synchronously and cleans up in a `finally` block will delete the directory before an `async fn`'s own `await`ed steps (e.g. submitting a form) have actually executed, since `fn(dir)` returns a pending promise immediately. Caught building `FinalStepScreen.test.tsx`'s real-temp-directory tests, where the fix was making the helper `async` and `await`ing the callback.
- **A lazy dynamic `import()` inside the `author` subcommand's own action handler** keeps Ink and React out of the module load path for every other CLI subcommand — `@archsmith/cli`'s other dependencies are just `commander` plus the renderer/schema packages, and that stays true for anyone not running `author`.

## MCP server conventions

MCP's three primitives differ in *who decides to use them*, and that should drive which one a new capability gets, not convenience: tools are model-controlled (the connected agent can call one on its own initiative, mid-task, in every compliant client); resources are application-controlled (the host client decides whether/when to surface one, often gated on a human manually attaching it); prompts are user-controlled (reachable only if a human explicitly invokes one, in a client that surfaces a picker at all). This is why `get_schema` was added as a tool ([issue #43](https://github.com/ayeshLK/archsmith/issues/43), closed) even though `archsmith://schema` already existed as a resource with the identical content — the resource fully serves a human curating context by hand, but nothing about it is guaranteed reachable by the model itself. Before adding a new tool/resource/prompt, ask who needs to decide to use it, and whether the primitive picked actually guarantees reachability for that actor.

Don't add a new MCP surface speculatively just because it's cheap to build. A `get_example` tool (bundling the minimal-valid fixture) and an `author_diagram` prompt were both designed in detail during the #43 discussion and deliberately not built: `get_schema` plus `validate`'s existing structured, path-specific errors already give an agent a targeted feedback loop, and neither addition had a demonstrated gap to justify it — "cheap to add" was explicitly rejected as sufficient reason. Build the next one only once there's a concrete signal (e.g. agents reliably finding `get_schema` but still failing to construct a valid IR) that the existing tools aren't enough.

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

1. Regenerate the golden master: `node packages/cli/dist/index.js render examples/ticket-booking/diagram.archsmith.json -o examples/ticket-booking/diagram.svg`.
2. Actually look at it — serve the repo locally (`python3 -m http.server`) and open the SVG in a browser (or use a browser-automation tool if you have one), or preview it on GitHub. Check specifically for text overflow, overlapping pills, borders coinciding with a parent frame, and misaligned rows — the recurring failure modes here.
3. If you changed something structural (a shared layout constant, a box function used by multiple columns), render a *second*, unrelated fixture too (e.g. `examples/minimal-valid/diagram.archsmith.json`) and check it there as well — a fix that only happens to look right on one example isn't verified as general.
4. Commit the regenerated SVG alongside the code change in the same commit, so a reviewer sees the diff and its visual effect together.
5. If you restructure `examples/` (move folders, rename example files, or change gallery URLs), sweep the renderer tests, example docs, and root README links in the same change — stale paths will fail CI even when the new files render correctly.

## Never invent content

If an IR is missing something the registry expects (e.g. no Entity Layer), render an honest, visibly-dashed gap note (`gapNoteBox`) — never fabricate a plausible-looking box to fill the space. The same applies to registry values: don't invent a color hex or icon shape ad hoc because a diagram "needs" one; that's a change-request, not a rendering-time decision (a hand-drawn DB-cylinder icon was tried once, exactly this way, and reverted as over-engineering).

## Example content stays fictional and generic

`examples/**/*.archsmith.json` should never reference a real company, product, or internal system by name — use plain descriptive names ("Booking Service," "Ticketing Identity Platform") rather than reaching for an invented "cool platform name." This project once had to walk back a supposedly-fictional example name after realizing it was actually lifted from a real internal reference source — the safer default is no invented brand at all, not "as long as it sounds made up."

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
