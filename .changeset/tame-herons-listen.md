---
"@archsmith/mcp-server": patch
---

Update the `render` tool's `embedFonts` description now that embedding uses a font subset sized to the diagram's own text (see the `@archsmith/renderer` changeset) rather than a fixed ~40 KB regardless of content.
