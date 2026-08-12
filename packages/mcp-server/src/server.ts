import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { render, validate, type DiagramIR } from "@archsmith/renderer";
import { getDiagramSchema, getRegistry, listRegistryNames, type RegistryName } from "@archsmith/schema";

// Sibling of @archsmith/cli, not a wrapper around it: both import
// @archsmith/renderer/@archsmith/schema directly and call render()/
// validate() in-process. The point of this package is giving any
// MCP-capable agent (not just Claude Code) the same capability, and
// letting it read the governed registries live instead of relying on a
// stale copy baked into a prompt.
//
// Split from index.ts (the stdio entrypoint) so this is importable and
// connectable to any Transport — an in-memory pair for tests, stdio for
// real use — without either side needing to know about the other.

const REGISTRY_NAMES = listRegistryNames();

const packageManifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as { version: string };

export function createServer(): McpServer {
  const server = new McpServer({ name: "archsmith-mcp", version: packageManifest.version });

  const schemaDiscoveryHint = {
    type: "text" as const,
    text: "Call get_schema for the full IR structural contract, and get_registry for governed vocabulary (colors, sub-layers), before retrying.",
  };

  server.registerTool(
    "get_schema",
    {
      title: "Get the diagram IR JSON Schema",
      description:
        "Returns the ArchSmith diagram IR JSON Schema (draft 2020-12) — the structural contract a diagram IR document must satisfy. Call this, and get_registry for governed vocabulary, before authoring an IR.",
    },
    async () => ({ content: [{ type: "text", text: JSON.stringify(getDiagramSchema(), null, 2) }] })
  );

  server.registerTool(
    "validate",
    {
      title: "Validate a diagram IR",
      description:
        "Validates an ArchSmith diagram IR document against the schema and governed registries (sub-layers, colors). Call get_schema and get_registry first to learn the required structure and governed vocabulary before authoring an IR. Returns { valid, errors }.",
      inputSchema: {
        ir: z.record(z.string(), z.unknown()).describe("The diagram IR document to validate."),
      },
    },
    async ({ ir }) => {
      const result = validate(ir);
      const resultBlock = { type: "text" as const, text: JSON.stringify(result, null, 2) };
      return { content: result.valid ? [resultBlock] : [resultBlock, schemaDiscoveryHint] };
    }
  );

  server.registerTool(
    "render",
    {
      title: "Render a diagram IR to SVG",
      description:
        "Validates then renders an ArchSmith diagram IR to a complete SVG document returned as one text content block. Call get_schema and get_registry first to learn the required IR structure and governed vocabulary before authoring a document. Font embedding defaults to false to keep MCP responses compact; only opt in if the SVG must render portably without installed fonts — embedding adds a fixed ~40 KB regardless of diagram size or complexity, and can exceed common MCP client result limits even for small, everyday diagrams. Fails with the validation errors (isError: true) instead of rendering if the IR is invalid — never renders broken geometry from an invalid document.",
      inputSchema: {
        ir: z.record(z.string(), z.unknown()).describe("The diagram IR document to render."),
        embedFonts: z
          .boolean()
          .optional()
          .describe(
            "Embed the bundled Arimo font for portable rendering. Adds a fixed ~40 KB to every response (two font weights, base64-encoded) regardless of how small or simple the diagram is — this alone can exceed some MCP clients' result-size limits. Default: false."
          ),
      },
    },
    async ({ ir, embedFonts }) => {
      const result = validate(ir);
      if (!result.valid) {
        return {
          isError: true,
          content: [{ type: "text", text: `Invalid diagram IR:\n${result.errors.join("\n")}` }, schemaDiscoveryHint],
        };
      }
      const svg = render(ir as unknown as DiagramIR, { skipValidate: true, embedFonts: embedFonts ?? false });
      return { content: [{ type: "text", text: svg }] };
    }
  );

  server.registerTool(
    "list_registries",
    {
      title: "List governed registry names",
      description: "Lists the governed registries (e.g. sub-layers, colors, icons) available via get_registry.",
    },
    async () => ({ content: [{ type: "text", text: JSON.stringify(REGISTRY_NAMES) }] })
  );

  server.registerTool(
    "get_registry",
    {
      title: "Get a governed registry's contents",
      description:
        "Returns the raw, current contents of a governed registry — the live source of truth for which colors/sub-layer types a diagram IR may use. This is governed vocabulary, not the IR's structural document contract; see get_schema for that. For 'colors' specifically, pass family to get just one color family instead of the whole registry.",
      inputSchema: {
        name: z.enum(REGISTRY_NAMES as [RegistryName, ...RegistryName[]]),
        family: z.string().optional().describe("For the 'colors' registry only: restrict to a single family, e.g. 'standard'."),
      },
    },
    async ({ name, family }) => {
      const registry = getRegistry(name);
      if (family === undefined) {
        return { content: [{ type: "text", text: JSON.stringify(registry, null, 2) }] };
      }
      if (name !== "colors") {
        return {
          isError: true,
          content: [{ type: "text", text: `family only applies to the "colors" registry, not "${name}"` }],
        };
      }
      const families = (registry as { families: Record<string, unknown> }).families;
      if (!(family in families)) {
        return {
          isError: true,
          content: [{ type: "text", text: `unknown color family "${family}". Known: ${Object.keys(families).join(", ")}` }],
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(families[family], null, 2) }] };
    }
  );

  server.registerResource(
    "diagram-schema",
    "archsmith://schema",
    {
      title: "ArchSmith diagram IR schema",
      description: "JSON Schema (draft 2020-12) defining what a valid diagram IR document looks like.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(getDiagramSchema(), null, 2) }],
    })
  );

  for (const name of REGISTRY_NAMES) {
    server.registerResource(
      `registry-${name}`,
      `archsmith://registries/${name}`,
      {
        title: `ArchSmith "${name}" registry`,
        description: `Governed, current contents of the "${name}" registry.`,
        mimeType: "application/json",
      },
      async (uri) => ({
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(getRegistry(name), null, 2) }],
      })
    );
  }

  return server;
}
