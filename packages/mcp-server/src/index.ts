#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const transport = new StdioServerTransport();
  await createServer().connect(transport);
}

// Diagnostics only ever go to stderr — stdout is the JSON-RPC channel
// StdioServerTransport owns, and anything else written there would corrupt
// the protocol stream from the client's point of view.
main().catch((err) => {
  console.error("archsmith-mcp: fatal error:", err);
  process.exit(1);
});
