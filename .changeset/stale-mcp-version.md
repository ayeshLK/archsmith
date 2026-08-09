---
"@archsmith/mcp-server": patch
---

Derive the advertised MCP server version from `package.json` at runtime instead of a hard-coded constant, so it never drifts from the published package version.
