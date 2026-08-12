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

`get_schema`, `render`, `validate`, `list_registries`, `get_registry` — mirror the CLI's own commands (same validate-before-render behavior, same `family` filter on `get_registry`). `render` defaults to `embedFonts: false` so the normal agent workflow stays compact; pass `embedFonts: true` deliberately when the exported SVG must include the bundled Arimo font and render identically without installed fonts. The embedded font is subset to just the glyphs that diagram's own text needs (see issue #55) rather than the whole font, so its size scales with the diagram instead of a fixed cost — still worth opting into deliberately, but no longer a blind tax regardless of content. The renderer library and CLI still embed fonts by default.

A render under 25,000 bytes of SVG (`INLINE_THRESHOLD_BYTES` in `renderStore.ts`) is returned as a single text content block, as above. A larger one — a big diagram, or `embedFonts: true` pushing an already-sizeable one over the line — is returned as a [`resource_link`](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#resource-links) instead: a small `{ type: "resource_link", uri: "archsmith://render/<id>", size, ... }` descriptor, fetchable via `resources/read` on that `uri`. This means the tool result itself never grows unbounded — unlike subsetting, which shrinks a fixed cost but still scales with diagram content, this has no ceiling on render size. A real Claude Code session tested against an equivalent-sized payload spent 3,279 tokens on the `resource_link` response versus 23,916 tokens inlining the same content directly — the model doesn't have to read bytes it doesn't need. `archsmith://render/<id>` entries live in a small in-memory cache bounded to the most recent 20 renders (`MAX_ENTRIES`); reading an evicted or unknown id returns a standard JSON-RPC `-32002` ("Resource not found") error, not a tool error.

### Render response sizes

Measured against the current fixtures as UTF-8 bytes, including a serialized JSON-RPC `{ jsonrpc, id, result }` response envelope. "SVG" is the underlying render size regardless of shape; "MCP response" is what's actually returned — either that SVG inlined, or (marked *link*) a small `resource_link` descriptor pointing at it:

| Fixture | Fonts | SVG | MCP response |
|---|---:|---:|---:|
| `minimal-valid` | omitted (default) | 9,014 B | 9,989 B |
| `minimal-valid` | embedded (subset) | 22,313 B | 23,289 B |
| `simple-3-tier-web-app` | omitted (default) | 12,555 B | 13,857 B |
| `simple-3-tier-web-app` | embedded (subset) | 26,130 B | 27,433 B |
| `ticket-booking` | omitted (default) | 23,441 B | 25,639 B |
| `ticket-booking` | embedded (subset) | 38,328 B | 355 B (*link*) |

Before subsetting, embedding cost a fixed ~40 KB regardless of fixture (two complete font weights) — enough to exceed common MCP client result limits even on a modest, everyday diagram like `simple-3-tier-web-app`, not just a maximal one (issue #55). Subsetting to each diagram's own text cuts that by roughly 40-55%, scaling with content instead of being a flat tax — but `ticket-booking` embedded is still 38,328 B, over the 25,000 B inline threshold, which is exactly the case the `resource_link` fallback above exists for: the tool response stays a small, constant-size descriptor no matter how large the underlying SVG is.

Before the response-shape fix in #50, the server also returned both SVG text and a duplicate base64 image block and embedded fonts by default; that made the `ticket-booking` response 149,897 B. The server now avoids duplicate payloads and keeps font embedding as an explicit, size-proportional portability tradeoff instead of hard-coding a particular client's result-size limit.

Real-host smoke test: Claude Code 2.1.153 with Claude Haiku 4.5 successfully rendered the full `ticket-booking` fixture through the stdio MCP server with `embedFonts` omitted. It received the SVG without an embedded `@font-face`.

`get_schema` returns the diagram IR JSON Schema — the same document as the `archsmith://schema` resource below, but as a tool the connected model can call on its own initiative before authoring an IR, rather than depending on the host client to surface a resource. `validate` and `render` name it (and `get_registry`) in their own descriptions, and again in their response content whenever the IR turns out to be invalid.

## Resources

`archsmith://schema` and one `archsmith://registries/<name>` per governed registry — lets an agent authoring an IR read the live, current schema/registries directly instead of working from a stale copy baked into a prompt.

`archsmith://render/<id>` is a third, dynamic kind: `render` registers one whenever a render is too large to inline (see above). Deliberately not listed via `resources/list` — per the [spec](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#resource-links), a resource link returned by a tool isn't guaranteed to appear there — it's only reachable via the `resource_link` `render` itself returned, and it's evicted from the bounded in-memory store once 20 more renders have happened, so it doesn't survive a server restart or accumulate unbounded memory in a long session.

## License

Apache-2.0
