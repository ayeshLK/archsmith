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

`render`, `validate`, `list_registries`, `get_registry` — mirror the CLI's own commands (same validate-before-render behavior, same `family` filter on `get_registry`). `render` returns the SVG as both plain text and an `image/svg+xml` content block, so a client that renders arbitrary image mime types can show the diagram inline.

## Resources

`archsmith://schema` and one `archsmith://registries/<name>` per governed registry — lets an agent authoring an IR read the live, current schema/registries directly instead of working from a stale copy baked into a prompt.

## License

Apache-2.0
