---
"@archsmith/mcp-server": patch
---

Keep MCP render responses within practical client result limits by returning one SVG text block and defaulting font embedding to false. Portable font-embedded output remains available with `embedFonts: true`; the renderer library and CLI defaults are unchanged.
