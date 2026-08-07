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

export function createServer(): McpServer {
  const server = new McpServer({ name: "archsmith-mcp", version: "0.1.0" });

  server.registerTool(
    "validate",
    {
      title: "Validate a diagram IR",
      description:
        "Validates an ArchSmith diagram IR document against the schema and governed registries (sub-layers, colors). Returns { valid, errors }.",
      inputSchema: {
        ir: z.record(z.string(), z.unknown()).describe("The diagram IR document to validate."),
      },
    },
    async ({ ir }) => {
      const result = validate(ir);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "render",
    {
      title: "Render a diagram IR to SVG",
      description:
        "Validates then renders an ArchSmith diagram IR to a complete SVG document. Fails with the validation errors (isError: true) instead of rendering if the IR is invalid — never renders broken geometry from an invalid document.",
      inputSchema: {
        ir: z.record(z.string(), z.unknown()).describe("The diagram IR document to render."),
        embedFonts: z
          .boolean()
          .optional()
          .describe("Embed the bundled Arimo font in the output SVG so it renders identically everywhere. Default: true."),
      },
    },
    async ({ ir, embedFonts }) => {
      const result = validate(ir);
      if (!result.valid) {
        return {
          isError: true,
          content: [{ type: "text", text: `Invalid diagram IR:\n${result.errors.join("\n")}` }],
        };
      }
      const svg = render(ir as unknown as DiagramIR, { skipValidate: true, embedFonts });
      return {
        content: [
          { type: "text", text: svg },
          { type: "image", data: Buffer.from(svg, "utf-8").toString("base64"), mimeType: "image/svg+xml" },
        ],
      };
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
        "Returns the raw, current contents of a governed registry — the live source of truth for which colors/sub-layer types a diagram IR may use. For 'colors' specifically, pass family to get just one color family instead of the whole registry.",
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
