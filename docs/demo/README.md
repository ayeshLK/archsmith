# Demo GIFs

Two GIFs, embedded in the root [README.md](../../README.md), both built the same way: a real command flow recorded with [asciinema](https://asciinema.org/) and converted to GIF with [agg](https://github.com/asciinema/agg) (`brew install asciinema agg`).

## `cli-demo.gif` — CLI flow

Shown at the top of the README. The exact two commands from the [Quick start](../../README.md#quick-start) section, run against `examples/ticket-booking/diagram.archsmith.json` — the same fixture as the static hero SVG shown right below the GIF, so the recording, the rendered diagram, and the copy-pasteable Quick Start commands all point at one example instead of three different ones.

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
