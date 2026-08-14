import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// dist/index.js -> package root is one level up. diagram-schema.json and
// registries/ ship alongside dist/ per package.json's "files" list, so this
// resolution works both in the monorepo (pre-publish) and after npm install.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export type RegistryName = "sub-layers" | "colors" | "icons";

const REGISTRY_FILES: Record<RegistryName, string> = {
  "sub-layers": "sub-layers.json",
  colors: "colors.json",
  icons: "icons.json",
};

export interface AuthoringGlossaryEntry {
  id: string;
  hint: string;
}

let schemaCache: unknown | undefined;
const registryCache = new Map<RegistryName, unknown>();
let glossaryCache: AuthoringGlossaryEntry[] | undefined;

/** Raw diagram-schema.json contents (parsed). Cached after first read. */
export function getDiagramSchema(): unknown {
  if (schemaCache === undefined) {
    const text = readFileSync(path.join(packageRoot, "diagram-schema.json"), "utf-8");
    schemaCache = JSON.parse(text);
  }
  return schemaCache;
}

/** One governed registry (sub-layers | colors | icons), parsed. Cached after first read. */
export function getRegistry(name: RegistryName): unknown {
  if (!registryCache.has(name)) {
    const file = REGISTRY_FILES[name];
    const text = readFileSync(path.join(packageRoot, "registries", file), "utf-8");
    registryCache.set(name, JSON.parse(text));
  }
  return registryCache.get(name);
}

/** All registry names this package knows about. */
export function listRegistryNames(): RegistryName[] {
  return Object.keys(REGISTRY_FILES) as RegistryName[];
}

/**
 * Plain-English authoring hints, keyed by column id (diagram-schema.json's
 * own columns.* property names) or sub-layer id (sub-layers.json's own
 * governed ids) — for a guided authoring UI (e.g. archsmith author) to
 * show before its first question about that section. Deliberately not a
 * RegistryName/getRegistry() entry: this is descriptive copy, never
 * governed vocabulary the schema validates against. Cached after first
 * read.
 */
export function getAuthoringGlossary(): AuthoringGlossaryEntry[] {
  if (glossaryCache === undefined) {
    const text = readFileSync(path.join(packageRoot, "registries", "authoring-glossary.json"), "utf-8");
    glossaryCache = (JSON.parse(text) as { entries: AuthoringGlossaryEntry[] }).entries;
  }
  return glossaryCache;
}

/** Convenience lookup over getAuthoringGlossary() — throws if `id` has no
 * entry, since a guided-authoring UI showing no hint at all for a real
 * section is exactly the silent gap this glossary exists to avoid. */
export function getAuthoringHint(id: string): string {
  const entry = getAuthoringGlossary().find((e) => e.id === id);
  if (!entry) {
    throw new Error(`archsmith/schema: no authoring-glossary entry for "${id}"`);
  }
  return entry.hint;
}

/** Absolute path to the schema/registry directory — for tooling that wants the raw files. */
export function getSchemaPackageRoot(): string {
  return packageRoot;
}
