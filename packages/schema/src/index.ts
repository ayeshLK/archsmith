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

let schemaCache: unknown | undefined;
const registryCache = new Map<RegistryName, unknown>();

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

/** Absolute path to the schema/registry directory — for tooling that wants the raw files. */
export function getSchemaPackageRoot(): string {
  return packageRoot;
}
