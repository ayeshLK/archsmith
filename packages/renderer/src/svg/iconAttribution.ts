import { readFileSync } from "node:fs";
import { getRegistry } from "@archsmith/schema";
import type { DiagramIR, ItemIR } from "../ir.js";
import { escapeXml } from "./node.js";

interface IconSource {
  name: string;
  url?: string;
  modified: boolean;
  note?: string;
}

interface IconRegistry {
  sources: { baseline: string; revision: string; license: string; licenseUrl: string };
  icons: Record<string, { source: IconSource }>;
}

const registry = getRegistry("icons") as IconRegistry;
let apacheLicense: string | undefined;

function getApacheLicense(): string {
  apacheLicense ??= readFileSync(new URL("../../licenses/MaterialSymbols-LICENSE.txt", import.meta.url), "utf-8").trim();
  return apacheLicense;
}

function allItems(ir: DiagramIR): ItemIR[] {
  return [
    ...ir.columns.inboundActors.items,
    ...ir.columns.corePlatform.subLayers.flatMap((layer) => layer.rows.flat()),
    ...ir.columns.corePlatform.systemsOfRecord.items,
    ...ir.columns.externalSystems.clusters.flatMap((cluster) => cluster.items),
  ];
}

/**
 * Adds the complete third-party license handoff to an exported SVG when it
 * contains Material-derived geometry. Keeping it in SVG metadata means the
 * renderer, CLI, and MCP exports all carry the same attribution and license.
 */
export function iconAttributionMetadata(ir: DiagramIR): string {
  const tokens = [...new Set(allItems(ir).map((item) => item.icon).filter((token): token is string => Boolean(token)))];
  const sources = tokens
    .map((token) => registry.icons[token]?.source)
    .filter((source): source is IconSource => Boolean(source?.url));
  if (sources.length === 0) return "";

  const attribution = [
    "ArchSmith item icon provenance and license",
    `Baseline: ${registry.sources.baseline}`,
    `Upstream revision: ${registry.sources.revision}`,
    `Apache-2.0 source license: ${registry.sources.licenseUrl}`,
    "Modified geometry included in this diagram:",
    ...sources.map((source) => `- ${source.name}: ${source.url} (redrawn as ArchSmith allow-listed monochrome 24x24 outline geometry)`),
    "The included source-inspired geometry is modified from the upstream SVGs. The original ArchSmith entity record-card geometry is not third-party artwork.",
    "The complete applicable Apache-2.0 license text follows. Preserve this metadata when redistributing the SVG or the marked geometry.",
    "",
    getApacheLicense(),
  ].join("\n");

  return `<metadata id="archsmith-icon-provenance">${escapeXml(attribution)}</metadata>`;
}
