import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "packages/schema/diagram-schema.json");
const pagesSource = path.join(repoRoot, "pages");
const outputDirectory = path.resolve(repoRoot, process.argv[2] ?? ".pages");
const schemaText = await readFile(schemaPath, "utf8");
const schema = JSON.parse(schemaText);
const schemaVersion = schema.properties?.schemaVersion?.const;

if (typeof schemaVersion !== "string") {
  throw new Error("diagram-schema.json must define properties.schemaVersion.const");
}

const expectedId = `https://ayeshlk.github.io/archsmith/schema/${schemaVersion}/diagram-schema.json`;
if (schema.$id !== expectedId) {
  throw new Error(`diagram-schema.json $id must be ${expectedId}`);
}

const archivedSchema = path.join(pagesSource, "schema", schemaVersion, "diagram-schema.json");
const archivedText = await readFile(archivedSchema, "utf8");
if (archivedText !== schemaText) {
  throw new Error(`pages/schema/${schemaVersion}/diagram-schema.json must exactly match packages/schema/diagram-schema.json`);
}

await rm(outputDirectory, { recursive: true, force: true });
await cp(pagesSource, outputDirectory, { recursive: true });
const latestDirectory = path.join(outputDirectory, "schema", "latest");
await mkdir(latestDirectory, { recursive: true });
await writeFile(path.join(latestDirectory, "diagram-schema.json"), schemaText);
await writeFile(path.join(outputDirectory, ".nojekyll"), "");
