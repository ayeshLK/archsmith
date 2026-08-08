import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("--version reports the package version", () => {
  const packageManifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as { version: string };
  const cliPath = fileURLToPath(new URL("./index.js", import.meta.url));

  const result = spawnSync(process.execPath, [cliPath, "--version"], { encoding: "utf-8" });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout.trim(), packageManifest.version);
});
