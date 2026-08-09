# CLI demo GIF

`cli-demo.gif` (embedded at the top of the root [README.md](../../README.md)) shows the real CLI flow end to end: `archsmith validate` on a fixture, then `archsmith render` to produce its SVG.

## What it shows

Using `examples/simple-3-tier-web-app/diagram.archsmith.json` — compact enough to read in a few seconds of playback, per [#16](https://github.com/ayeshLK/archsmith/issues/16). The MCP/agent flow described in that issue isn't in this GIF; it needs a real screen recording of a desktop MCP client and is tracked separately.

## Regenerate

Requires [asciinema](https://asciinema.org/) and [agg](https://github.com/asciinema/agg) (`brew install asciinema agg`), and `@archsmith/cli` built and linked (`npm run build --workspace=@archsmith/cli && npm link --prefix packages/cli`).

From the repo root:

```bash
mkdir -p /tmp/archsmith-demo
cp examples/simple-3-tier-web-app/diagram.archsmith.json /tmp/archsmith-demo/web-app.archsmith.json
asciinema rec --headless --overwrite --window-size 90x6 --title "ArchSmith CLI demo" --idle-time-limit 2 \
  -c "bash docs/demo/record-cli-demo.sh" /tmp/archsmith-demo/cli-demo.cast
agg --font-size 18 --theme monokai --idle-time-limit 2 /tmp/archsmith-demo/cli-demo.cast docs/demo/cli-demo.gif
```
