---
"@archsmith/mcp-server": minor
---

`render` now returns a `resource_link` instead of inline text once the SVG exceeds 25,000 bytes (a large diagram, or `embedFonts: true` pushing an already-sizeable one over the line), fetchable via `resources/read` on the returned `archsmith://render/<id>` URI. Unlike font subsetting (issue #55), which only shrinks a cost that still scales with diagram content, this removes the ceiling on render size entirely — the tool result itself never grows unbounded. Renders below the threshold are unaffected. Backed by a small in-memory store bounded to the most recent 20 renders; reading an evicted or unknown id returns a standard `-32002` ("Resource not found") JSON-RPC error.
