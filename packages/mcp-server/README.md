# @archsmith/mcp-server

The `archsmith-mcp` MCP server for [ArchSmith](https://github.com/ayeshLK/archsmith) — exposes `render`/`validate`/registry lookups to any MCP-capable agent, over stdio.

A sibling of `@archsmith/cli`, not a wrapper around it: both call `render()`/`validate()` from `@archsmith/renderer` directly. See the [root README](https://github.com/ayeshLK/archsmith#readme) for the full picture.

## Connecting it to an MCP host

Point the host at the built entrypoint, e.g. in Claude Desktop's `claude_desktop_config.json`:

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

## Tools

`get_schema`, `render`, `validate`, `list_registries`, `get_registry` — mirror the CLI's own commands (same validate-before-render behavior, same `family` filter on `get_registry`). `render` returns the complete SVG as one text content block. It defaults to `embedFonts: false` so the normal agent workflow stays compact; pass `embedFonts: true` deliberately when the exported SVG must include the bundled Arimo font and render identically without installed fonts. The embedded font is subset to just the glyphs that diagram's own text needs (see issue #55) rather than the whole font, so its size scales with the diagram instead of a fixed cost. The renderer library and CLI still embed fonts by default.

### Render response sizes

Measured against the current fixtures as UTF-8 bytes, including a serialized JSON-RPC `{ jsonrpc, id, result }` response envelope:

| Fixture | Fonts | SVG | MCP response |
|---|---:|---:|---:|
| `minimal-valid` | omitted (default) | 9,014 B | 9,989 B |
| `minimal-valid` | embedded (subset) | 22,313 B | 23,289 B |
| `simple-3-tier-web-app` | omitted (default) | 12,555 B | 13,857 B |
| `simple-3-tier-web-app` | embedded (subset) | 26,130 B | 27,433 B |
| `ticket-booking` | omitted (default) | 23,441 B | 25,639 B |
| `ticket-booking` | embedded (subset) | 38,328 B | 40,527 B |

Before subsetting, embedding cost a fixed ~40 KB regardless of fixture (two complete font weights) — enough to exceed common MCP client result limits even on a modest, everyday diagram like `simple-3-tier-web-app`, not just a maximal one (issue #55). Subsetting to each diagram's own text cuts that by roughly 40-55%, scaling with content instead of being a flat tax.

Before the response-shape fix in #50, the server also returned both SVG text and a duplicate base64 image block and embedded fonts by default; that made the `ticket-booking` response 149,897 B. The server now avoids duplicate payloads and keeps font embedding as an explicit, size-proportional portability tradeoff instead of hard-coding a particular client's result-size limit.

Real-host smoke test: Claude Code 2.1.153 with Claude Haiku 4.5 successfully rendered the full `ticket-booking` fixture through the stdio MCP server with `embedFonts` omitted. It received the SVG without an embedded `@font-face`.

`get_schema` returns the diagram IR JSON Schema — the same document as the `archsmith://schema` resource below, but as a tool the connected model can call on its own initiative before authoring an IR, rather than depending on the host client to surface a resource. `validate` and `render` name it (and `get_registry`) in their own descriptions, and again in their response content whenever the IR turns out to be invalid.

## Resources

`archsmith://schema` and one `archsmith://registries/<name>` per governed registry — lets an agent authoring an IR read the live, current schema/registries directly instead of working from a stale copy baked into a prompt.

## License

Apache-2.0
