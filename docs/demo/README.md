# CLI demo GIF

`cli-demo.gif` (embedded at the top of the root [README.md](../../README.md)) shows the real CLI flow end to end: `archsmith validate` on a fixture, then `archsmith render` to produce its SVG.

## What it shows

The exact two commands from the root README's [Quick start](../../README.md#quick-start), run against `examples/ticket-booking/diagram.archsmith.json` — the same fixture as the static hero SVG shown right below the GIF, so the recording, the rendered diagram, and the copy-pasteable Quick Start commands all point at one example instead of three different ones. The MCP/agent flow described in [#16](https://github.com/ayeshLK/archsmith/issues/16) isn't in this GIF; it needs a real screen recording of a desktop MCP client and is tracked separately.

## Regenerate

Requires [asciinema](https://asciinema.org/) and [agg](https://github.com/asciinema/agg) (`brew install asciinema agg`), and `@archsmith/cli` built and linked (`npm run build --workspace=@archsmith/cli && npm link --prefix packages/cli`).

From the repo root:

```bash
mkdir -p /tmp/archsmith-demo/ticket-booking
cp examples/ticket-booking/diagram.archsmith.json /tmp/archsmith-demo/ticket-booking/diagram.archsmith.json
asciinema rec --headless --overwrite --window-size 100x6 --title "ArchSmith CLI demo" --idle-time-limit 2 \
  -c "bash docs/demo/record-cli-demo.sh" /tmp/archsmith-demo/cli-demo.cast
agg --font-size 18 --theme monokai --idle-time-limit 2 /tmp/archsmith-demo/cli-demo.cast docs/demo/cli-demo.gif
```
