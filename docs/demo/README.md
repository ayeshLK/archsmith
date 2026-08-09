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

Shown in the "MCP server" section. Same `ticket-booking` fixture, called over MCP instead of argv: an agent calling `validate` then `render` on `archsmith-mcp` and reporting the result.

Unlike the CLI GIF, `docs/demo/record-mcp-demo.sh` doesn't run a live agent — it replays a **fixed, real transcript** (the exact tool names, arguments, and results below) as typed-out terminal lines. Two things forced that:

- `claude -p` (print mode) doesn't render tool-call activity to the terminal the way the interactive TUI does, and driving the actual interactive TUI from a non-interactive recording is unreliable (it expects a real terminal, not scripted input).
- Getting a *clean* transcript at all took prompt-tuning: the naive prompt made the agent call `render` with its default `embedFonts: true`, and the embedded-font SVG (65K+ characters) blew past the MCP tool-result size limit, sending the agent into a visibly messy recovery path (a failed `jq` call, two blocked `Bash` calls) trying to confirm the oversized result actually contained an SVG. Passing `embedFonts: false` avoids that entirely.

To capture a fresh transcript (costs real API usage — this is a live Claude Code + MCP session, not a mock):

```bash
npm run build --workspace=@archsmith/mcp-server
cat > /tmp/archsmith-mcp-config.json <<'EOF'
{
  "mcpServers": {
    "archsmith": { "command": "node", "args": ["/absolute/path/to/archsmith/packages/mcp-server/dist/index.js"] }
  }
}
EOF
claude -p "Using the archsmith MCP server's validate and render tools directly (call the tools by name, do not read the file yourself first), call mcp__archsmith__validate then mcp__archsmith__render with embedFonts set to false on the file at /absolute/path/to/archsmith/examples/ticket-booking/diagram.archsmith.json (read the file once to get its JSON content, pass that as the ir argument). Do not inspect the raw SVG text afterward. Report in one short sentence whether both calls succeeded." \
  --mcp-config /tmp/archsmith-mcp-config.json --strict-mcp-config \
  --allowedTools "mcp__archsmith__validate,mcp__archsmith__render,Read" \
  --output-format stream-json --verbose > /tmp/archsmith-mcp-transcript.jsonl
```

Then update the hard-coded tool-call/result lines in `docs/demo/record-mcp-demo.sh` (`print_step` calls) to match what actually came back, and re-run the same `asciinema rec` + `agg` pipeline as above, swapping in `record-mcp-demo.sh` and a window size that fits the longest line (`100x11` was right for the current transcript).
