import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "./server.js";

const examplesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../examples");

function loadFixture(relPath: string): unknown {
  return JSON.parse(readFileSync(path.join(examplesDir, relPath), "utf-8"));
}

/**
 * Connects a real Client to a real McpServer over an in-memory transport
 * pair — this exercises the actual JSON-RPC request/response cycle (tool
 * schemas, argument parsing, content-block shapes), not just calling the
 * registered handler functions directly. Each test gets its own pair so
 * they can run independently.
 */
async function connectedClient(): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  const block = result.content.find((c) => c.type === "text");
  assert.ok(block, "expected a text content block");
  return block!.text!;
}

test("advertises the installed package version, not a hard-coded constant", async () => {
  const packageManifest = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../package.json"), "utf-8"));
  const client = await connectedClient();
  assert.equal(client.getServerVersion()?.version, packageManifest.version);
});

test("lists all five tools", async () => {
  const client = await connectedClient();
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["get_registry", "get_schema", "list_registries", "render", "validate"]);
});

test("validate and render tool descriptions direct agents to get_schema and get_registry", async () => {
  const client = await connectedClient();
  const { tools } = await client.listTools();
  for (const name of ["validate", "render"]) {
    const tool = tools.find((t) => t.name === name);
    assert.ok(tool?.description?.includes("get_schema"), `${name} description should mention get_schema`);
    assert.ok(tool?.description?.includes("get_registry"), `${name} description should mention get_registry`);
  }
  const renderTool = tools.find((tool) => tool.name === "render");
  assert.ok(renderTool?.description?.includes("defaults to false"));
  assert.ok(
    ((renderTool?.inputSchema as any).properties.embedFonts.description as string).includes("Default: false")
  );
});

test("lists the schema resource plus one resource per registry", async () => {
  const client = await connectedClient();
  const { resources } = await client.listResources();
  const uris = resources.map((r) => r.uri).sort();
  assert.deepEqual(uris, [
    "archsmith://registries/colors",
    "archsmith://registries/icons",
    "archsmith://registries/sub-layers",
    "archsmith://schema",
  ]);
});

test("validate tool reports a valid IR as valid, with no discovery hint", async () => {
  const client = await connectedClient();
  const ir = loadFixture("minimal-valid/diagram.archsmith.json");
  const result = (await client.callTool({ name: "validate", arguments: { ir } })) as any;
  const parsed = JSON.parse(textOf(result));
  assert.equal(parsed.valid, true);
  assert.deepEqual(parsed.errors, []);
  assert.equal(result.content.length, 1);
});

test("validate tool reports a broken IR as invalid, with the real error and a get_schema hint", async () => {
  const client = await connectedClient();
  const ir = loadFixture("broken-examples/missing-subtitle.archsmith.json");
  const result = (await client.callTool({ name: "validate", arguments: { ir } })) as any;
  const parsed = JSON.parse(textOf(result));
  assert.equal(parsed.valid, false);
  assert.ok(parsed.errors.some((e: string) => e.includes("subtitle")));
  assert.equal(result.content.length, 2);
  assert.ok(result.content[1].text.includes("get_schema"));
});

test("render tool returns one compact SVG text block by default", async () => {
  const client = await connectedClient();
  const ir = loadFixture("minimal-valid/diagram.archsmith.json");
  const result = (await client.callTool({ name: "render", arguments: { ir } })) as any;
  assert.equal(result.isError, undefined);
  const svg = textOf(result);
  assert.ok(svg.startsWith("<svg"));
  assert.ok(!svg.includes("@font-face"));
  assert.equal(result.content.length, 1);
});

test("render tool honors explicit font embedding opt-in and opt-out", async () => {
  const client = await connectedClient();
  const ir = loadFixture("minimal-valid/diagram.archsmith.json");
  const embedded = (await client.callTool({ name: "render", arguments: { ir, embedFonts: true } })) as any;
  const unembedded = (await client.callTool({ name: "render", arguments: { ir, embedFonts: false } })) as any;
  assert.ok(textOf(embedded).includes("@font-face"));
  assert.ok(!textOf(unembedded).includes("@font-face"));
  assert.equal(embedded.content.length, 1);
  assert.equal(unembedded.content.length, 1);
});

test("default full-featured render stays below the compact MCP response budget", async () => {
  const client = await connectedClient();
  const ir = loadFixture("ticket-booking/diagram.archsmith.json");
  const result = await client.callTool({ name: "render", arguments: { ir } });
  const jsonRpcResponse = JSON.stringify({ jsonrpc: "2.0", id: 1, result });
  assert.ok(Buffer.byteLength(jsonRpcResponse) < 30_000, `response was ${Buffer.byteLength(jsonRpcResponse)} bytes`);
});

test("embedFonts: true now costs proportionally less than the old fixed ~40KB, even on a modest fixture (issue #55)", async () => {
  // Issue #55 originally found the font-embedding tax was a fixed cost
  // (two complete base64 font weights spliced in) regardless of diagram
  // content, blowing past the compact-path budget even for a fixture far
  // smaller than ticket-booking. @archsmith/renderer now subsets the
  // embedded font to just the glyphs this diagram's text needs, so the
  // added cost scales with content instead of being a flat ~40KB tax.
  // This asserts the fix actually holds for a representative fixture, and
  // guards against the subsetting silently regressing back to full-font
  // embedding (which would blow the delta back out to ~40KB).
  const client = await connectedClient();
  const ir = loadFixture("simple-3-tier-web-app/diagram.archsmith.json");
  const compact = await client.callTool({ name: "render", arguments: { ir } });
  const embedded = await client.callTool({ name: "render", arguments: { ir, embedFonts: true } });
  const compactBytes = Buffer.byteLength(JSON.stringify({ jsonrpc: "2.0", id: 1, result: compact }));
  const embeddedBytes = Buffer.byteLength(JSON.stringify({ jsonrpc: "2.0", id: 1, result: embedded }));
  assert.ok(compactBytes < 30_000, `compact response was ${compactBytes} bytes`);
  assert.ok(embeddedBytes < 30_000, `expected embedding to stay compact on this fixture after subsetting; got ${embeddedBytes} bytes`);
  const delta = embeddedBytes - compactBytes;
  assert.ok(delta < 20_000, `expected the subset font's added cost to be well under the old fixed ~40KB tax; got ${delta} bytes`);
});

test("render tool refuses to render an invalid IR, returning isError and a get_schema hint instead of broken SVG", async () => {
  const client = await connectedClient();
  const ir = loadFixture("broken-examples/unknown-registry-id.archsmith.json");
  const result = (await client.callTool({ name: "render", arguments: { ir } })) as any;
  assert.equal(result.isError, true);
  assert.ok(textOf(result).includes("orchestration-layer-that-does-not-exist"));
  assert.ok(result.content.some((c: any) => c.text?.includes("get_schema")));
});

test("list_registries returns the three governed registry names", async () => {
  const client = await connectedClient();
  const result = await client.callTool({ name: "list_registries", arguments: {} });
  const names = JSON.parse(textOf(result as any));
  assert.deepEqual([...names].sort(), ["colors", "icons", "sub-layers"]);
});

test("get_registry returns the whole registry by default, and one family when asked", async () => {
  const client = await connectedClient();
  const whole = await client.callTool({ name: "get_registry", arguments: { name: "colors" } });
  const wholeParsed = JSON.parse(textOf(whole as any));
  assert.ok(wholeParsed.families.standard);

  const family = await client.callTool({ name: "get_registry", arguments: { name: "colors", family: "standard" } });
  const familyParsed = JSON.parse(textOf(family as any));
  assert.ok(familyParsed.layerTokens);
  assert.equal(familyParsed.families, undefined);
});

test("get_registry rejects family for a registry that doesn't have families", async () => {
  const client = await connectedClient();
  const result = (await client.callTool({ name: "get_registry", arguments: { name: "sub-layers", family: "standard" } })) as any;
  assert.equal(result.isError, true);
  assert.ok(textOf(result).includes("only applies to"));
});

test("get_schema returns the same schema as the archsmith://schema resource", async () => {
  const client = await connectedClient();
  const toolResult = await client.callTool({ name: "get_schema", arguments: {} });
  const toolSchema = JSON.parse(textOf(toolResult as any));
  const { contents } = await client.readResource({ uri: "archsmith://schema" });
  const resourceSchema = JSON.parse((contents[0] as any).text);
  assert.deepEqual(toolSchema, resourceSchema);
  assert.equal(toolSchema.title, "ArchSmith Diagram IR");
});

test("reads the diagram-schema resource", async () => {
  const client = await connectedClient();
  const { contents } = await client.readResource({ uri: "archsmith://schema" });
  const schema = JSON.parse((contents[0] as any).text);
  assert.equal(schema.title, "ArchSmith Diagram IR");
});

test("reads a registry resource", async () => {
  const client = await connectedClient();
  const { contents } = await client.readResource({ uri: "archsmith://registries/colors" });
  const registry = JSON.parse((contents[0] as any).text);
  assert.ok(registry.families.standard);
});
