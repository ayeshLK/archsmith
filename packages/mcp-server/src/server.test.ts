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

test("lists all four tools", async () => {
  const client = await connectedClient();
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["get_registry", "list_registries", "render", "validate"]);
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

test("validate tool reports a valid IR as valid", async () => {
  const client = await connectedClient();
  const ir = loadFixture("minimal-valid/diagram.archsmith.json");
  const result = await client.callTool({ name: "validate", arguments: { ir } });
  const parsed = JSON.parse(textOf(result as any));
  assert.equal(parsed.valid, true);
  assert.deepEqual(parsed.errors, []);
});

test("validate tool reports a broken IR as invalid, with the real error", async () => {
  const client = await connectedClient();
  const ir = loadFixture("broken-examples/missing-subtitle.archsmith.json");
  const result = await client.callTool({ name: "validate", arguments: { ir } });
  const parsed = JSON.parse(textOf(result as any));
  assert.equal(parsed.valid, false);
  assert.ok(parsed.errors.some((e: string) => e.includes("subtitle")));
});

test("render tool returns SVG as both text and an image content block", async () => {
  const client = await connectedClient();
  const ir = loadFixture("minimal-valid/diagram.archsmith.json");
  const result = (await client.callTool({ name: "render", arguments: { ir } })) as any;
  assert.equal(result.isError, undefined);
  const svg = textOf(result);
  assert.ok(svg.startsWith("<svg"));
  const image = result.content.find((c: any) => c.type === "image");
  assert.ok(image, "expected an image content block");
  assert.equal(image.mimeType, "image/svg+xml");
  assert.equal(Buffer.from(image.data, "base64").toString("utf-8"), svg);
});

test("render tool refuses to render an invalid IR, returning isError instead of broken SVG", async () => {
  const client = await connectedClient();
  const ir = loadFixture("broken-examples/unknown-registry-id.archsmith.json");
  const result = (await client.callTool({ name: "render", arguments: { ir } })) as any;
  assert.equal(result.isError, true);
  assert.ok(textOf(result).includes("orchestration-layer-that-does-not-exist"));
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
