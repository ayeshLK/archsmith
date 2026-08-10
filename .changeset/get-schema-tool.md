---
"@archsmith/mcp-server": minor
"@archsmith/cli": minor
---

Add a `get_schema` MCP tool and `archsmith schema show` CLI command so a tool-oriented agent or CLI user can discover the diagram IR's structural JSON Schema directly, without needing to read the `archsmith://schema` MCP resource. `render`/`validate` tool descriptions now point agents at `get_schema` and `get_registry` before authoring an IR, and their responses include the same pointer whenever the IR turns out to be invalid.
