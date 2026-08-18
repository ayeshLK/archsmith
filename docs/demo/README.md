# Demo GIFs

Three GIFs, embedded in the root [README.md](../../README.md), all built the same way: a real command flow recorded with [asciinema](https://asciinema.org/) and converted to GIF with [agg](https://github.com/asciinema/agg) (`brew install asciinema agg`).

## `author-demo.gif` — `archsmith author` flow

Shown at the top of the README, as the hero GIF — `archsmith author` is the recommended way to create a diagram from scratch (see [Quick start](../../README.md#quick-start)), so it leads. A full, real wizard session, driven end to end via [`expect`](https://core.tcl-lang.org/expect/index) (not a scripted-input pipe — Ink requires a real TTY and exits immediately otherwise, see `cli.tsx`'s `isTTY` check), through every section: title/subtitle/deployed-on, one Inbound Actor, Ingress, Core Platform (Discovery and Governance and Entity Layer both marked absent with a one-line reason, Execution and Capability given its one mandatory item), Systems of Record, Egress, one External Systems cluster with one item, Legend "include," Review confirmed as-is, then save under the default suggested name. Ticket-booking-themed fictional content, consistent with `examples/ticket-booking/` — never a real company/product name (see [AGENTS.md](../../AGENTS.md#example-content-stays-fictional-and-generic)).

The exact diagram this session produces is committed alongside the GIF as `author-demo.archsmith.json`/`author-demo.svg` — copied byte-for-byte from that same recording run's scratch output, never a separate/hand-crafted fixture, so the hero section's GIF and static diagram always show the same example (the same reasoning as `cli-demo.gif`'s pairing with `ticket-booking`, below). Regenerate both together whenever the session script changes — a stale pair (GIF showing one session, SVG showing an older one) is worse than not pairing them at all.

Requires `@archsmith/cli` built (`npm run build --workspace=@archsmith/cli` — no `npm link` needed, `drive-author-demo.exp` spawns `packages/cli/dist/index.js` directly). From the repo root:

```bash
asciinema rec --headless --overwrite --window-size 100x16 --title "ArchSmith author demo" --idle-time-limit 2 \
  -c "bash docs/demo/record-author-demo.sh" /tmp/archsmith-demo/author-demo.cast
agg --font-size 18 --theme monokai --idle-time-limit 2 /tmp/archsmith-demo/author-demo.cast docs/demo/author-demo.gif
cp /tmp/archsmith-demo/ticket-booking-platform/ticket-booking-platform.archsmith.json docs/demo/author-demo.archsmith.json
cp /tmp/archsmith-demo/ticket-booking-platform/ticket-booking-platform.svg docs/demo/author-demo.svg
```

`record-author-demo.sh` creates its own scratch directory (`/tmp/archsmith-demo/ticket-booking-platform`) and types the fake `archsmith author` invocation line, the same opening beat as the CLI GIF below, before `drive-author-demo.exp` takes over and drives the real interactive session.

`100x16` matches `mcp-demo.gif`'s window below — deliberately *shorter* than the session's tallest screen (Review, ~35 lines). An earlier version of this GIF sized the window to fit Review in full (`100x38`), which meant every other screen (most of the session) showed mostly empty space beneath a few lines of text. Ink turned out to make the shorter window safe: every top-level screen change (Legend→Review, Review→Save, Save→Done) does a hard terminal clear (`\x1b[2J\x1b[3J\x1b[H`), not an incremental cursor-up erase — only *within* a still-mounted screen (typing, moving a select highlight) does Ink erase incrementally, and that never needs more than the current screen's own line count. So a too-short window just means Review's top scrolls off normally during that one screen (the same thing a real narrow terminal would do), with no corruption risk on the screens after it. Confirmed by inspecting the raw ANSI transcript directly, not assumed.

Three non-obvious things the `.exp` script works around, worth knowing if this is ever regenerated:

- **Ink doesn't finish attaching its raw-mode input listener the instant its first frame paints.** Sending keystrokes immediately after `spawn` swallows the very first `Enter`, shifting every field's value by one for the rest of the session. Fixed with a one-time ~700ms pause after the intro screen's first frame; no per-field pause is needed anywhere else.
- **Typing a whole field value in one `send` call is technically correct but visually useless** — the value appears to snap into place rather than being typed, which defeats the point of a demo GIF. `type_text` sends one character at a time with a real delay between each (mirroring `record-cli-demo.sh`'s `type_cmd`), so the recording actually shows typing happening.
- **Sending Enter immediately after a burst of typed characters risks landing in the same input chunk as trailing text**, which `ink-text-input` treats as a paste — inserting a literal `\r` into the field instead of submitting, silently corrupting that field's saved value. `type_text` drains any stale buffered output before typing a new field and confirms an echo of the typed tail before ever sending Enter; `confirm_submit` additionally retries the Enter (safe — resubmitting an already-typed, unchanged value is a no-op) if Ink doesn't visibly react within a short window, since a `catch` around `expect` cannot on its own distinguish a real non-match from a plain timeout.
- **`expect`'s own `spawn` command prints `spawn <full command>` by default**, which leaks the absolute local filesystem path (including the machine's username, since the command is `node /Users/<you>/.../packages/cli/dist/index.js author`) straight into the recording. `log_user 0` wrapped around the `spawn` call (re-enabled with `log_user 1` immediately after) suppresses just that one line.

## `cli-demo.gif` — CLI flow

Shown in the [CLI usage](../../README.md#cli-usage) section, as a supplementary illustration of `validate`/`render` against an existing IR document (hand-written, agent-authored, or saved from `archsmith author`) — it no longer leads the README now that `author-demo.gif` does. The exact two commands from the "start from an example" part of [Quick start](../../README.md#quick-start), run against `examples/ticket-booking/diagram.archsmith.json` — the same fixture as the static hero SVG, so the recording, the rendered diagram, and the copy-pasteable commands all point at one example instead of three different ones.

Requires `@archsmith/cli` built and linked (`npm run build --workspace=@archsmith/cli && npm link --prefix packages/cli`). From the repo root:

```bash
mkdir -p /tmp/archsmith-demo/ticket-booking
cp examples/ticket-booking/diagram.archsmith.json /tmp/archsmith-demo/ticket-booking/diagram.archsmith.json
asciinema rec --headless --overwrite --window-size 100x6 --title "ArchSmith CLI demo" --idle-time-limit 2 \
  -c "bash docs/demo/record-cli-demo.sh" /tmp/archsmith-demo/cli-demo.cast
agg --font-size 18 --theme monokai --idle-time-limit 2 /tmp/archsmith-demo/cli-demo.cast docs/demo/cli-demo.gif
```

## `mcp-demo.gif` — MCP flow

Shown in the "MCP server" section. Demonstrates the thing the schema/registries-as-MCP-resources design actually enables: a user describes an architecture in plain English, the agent reads the live schema + registries, asks about whatever the description leaves ambiguous relative to what the schema requires, then drafts an IR, `validate`s it, and `render`s it — all over MCP, no archsmith-side LLM call.

This GIF remains a condensed presentation, not the source of truth for a reproducible run. The separately recorded [`examples/agent-authored-architecture-diagram/`](../../examples/agent-authored-architecture-diagram/README.md) artifact retains its requirement, clarification and review turns, pinned host/package configuration, privacy-reviewed tool sequence, final IR/SVG, and consumer CI workflow. The current GIF predates that artifact and is not presented as a replay of it.

Unlike the CLI GIF, `docs/demo/record-mcp-demo.sh` doesn't run a live agent — it replays a **fixed, real transcript** (condensed for length, but not fabricated — see below) as typed-out terminal lines. Three things forced that:

- `claude -p` (print mode) doesn't render tool-call activity to the terminal the way the interactive TUI does, and driving the actual interactive TUI from a non-interactive recording is unreliable (it expects a real terminal, not scripted input).
- The real clarifying-question turn came back as 7 numbered points (schema fields the one-line prompt genuinely left open: gateway naming, `deployedOn`, sub-layers, `systemsOfRecord`, the external notification provider, actor granularity, title/subtitle). That's real and correct agent behavior, but too long to read comfortably in a 30-60s GIF — the displayed version keeps 3 representative asks and answers them together in the next line, same as the real second turn did.
- The original run exposed an MCP transport bug: `render` embedded fonts by default and returned the SVG twice, producing an oversized tool result and a noisy agent recovery path. The MCP server now defaults to one unembedded SVG text block, so the normal call needs no hidden workaround; font-portable output remains available with an explicit `embedFonts: true`.

To capture a fresh transcript (costs real API usage — this is a live Claude Code + MCP session, not a mock; two turns, roughly $0.50 total in the original capture):

```bash
npm run build --workspace=@archsmith/mcp-server
mkdir -p /tmp/archsmith-draft-demo
cat > /tmp/archsmith-draft-demo/mcp-config.json <<'EOF'
{
  "mcpServers": {
    "archsmith": { "command": "node", "args": ["/absolute/path/to/archsmith/packages/mcp-server/dist/index.js"] }
  }
}
EOF

# Turn 1: an intentionally underspecified requirement, restricted to
# MCP-resource + archsmith tools only (no Read/Bash/Write) so it must
# work from the schema/registries, not the local filesystem.
cd /tmp/archsmith-draft-demo && claude -p "I want an architecture diagram for a food ordering platform: customers order through our mobile app, which hits our backend that manages orders. We also send order confirmations somehow. Before drafting anything, check the archsmith MCP server's schema/registries and ask me if anything about my requirements is ambiguous or underspecified relative to what the schema needs. Don't validate or render yet." \
  --mcp-config /tmp/archsmith-draft-demo/mcp-config.json --strict-mcp-config \
  --allowedTools "ListMcpResourcesTool,ReadMcpResourceTool,mcp__archsmith__list_registries,mcp__archsmith__get_registry,mcp__archsmith__validate,mcp__archsmith__render" \
  --output-format stream-json --verbose > /tmp/archsmith-draft-demo/turn1.jsonl

# Turn 2: answer whatever it asked, and let it draft + validate + render.
# --continue resumes the same session in the same cwd.
cd /tmp/archsmith-draft-demo && claude -p --continue "<answers to whatever it asked — see turn1.jsonl>. Go ahead and draft the IR, then call validate, and once it's valid call render. Report in 1-2 short sentences whether it validated and rendered successfully." \
  --mcp-config /tmp/archsmith-draft-demo/mcp-config.json --strict-mcp-config \
  --allowedTools "ListMcpResourcesTool,ReadMcpResourceTool,mcp__archsmith__list_registries,mcp__archsmith__get_registry,mcp__archsmith__validate,mcp__archsmith__render" \
  --output-format stream-json --verbose > /tmp/archsmith-draft-demo/turn2.jsonl
```

Then update the hard-coded lines in `docs/demo/record-mcp-demo.sh` (the `type_cmd`/`print_line`/`print_step` calls) to match what actually came back — condensing the clarifying question if needed, same as described above — and re-run the same `asciinema rec` + `agg` pipeline as the CLI GIF, sizing the window to the longest line (`95x16` was right for the current transcript; unlike the CLI GIF's window, this one is intentionally shorter than the total line count, so early lines scroll off — that's fine, it mirrors how a real terminal session looks).
