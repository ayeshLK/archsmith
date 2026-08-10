import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getDiagramSchema } from "@archsmith/schema";

test("--version reports the package version", () => {
  const packageManifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as { version: string };
  const cliPath = fileURLToPath(new URL("./index.js", import.meta.url));

  const result = spawnSync(process.execPath, [cliPath, "--version"], { encoding: "utf-8" });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout.trim(), packageManifest.version);
});

test("schema show prints exactly the schema package's diagram-schema.json", () => {
  const cliPath = fileURLToPath(new URL("./index.js", import.meta.url));

  const result = spawnSync(process.execPath, [cliPath, "schema", "show"], { encoding: "utf-8" });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const schema = JSON.parse(result.stdout);
  assert.equal(schema.title, "ArchSmith Diagram IR");
  assert.deepEqual(schema, getDiagramSchema());
});
