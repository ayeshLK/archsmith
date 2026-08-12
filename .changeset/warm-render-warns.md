---
"@archsmith/mcp-server": patch
---

Clarify that `render`'s `embedFonts: true` adds a fixed ~40 KB regardless of diagram size — not a size-proportional cost — since that alone can exceed common MCP client result limits even for small diagrams. Add a regression test pinning this cost against a modest, everyday fixture (not just the maximal stress case), so it's caught if it grows further.
