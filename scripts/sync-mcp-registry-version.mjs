import { readFile, writeFile } from "node:fs/promises";

const packagePath = new URL("../packages/mcp-server/package.json", import.meta.url);
const serverPath = new URL("../packages/mcp-server/server.json", import.meta.url);
const checkOnly = process.argv.includes("--check");

const packageManifest = JSON.parse(await readFile(packagePath, "utf8"));
const serverManifest = JSON.parse(await readFile(serverPath, "utf8"));
const registryPackage = serverManifest.packages?.find(
  ({ registryType, identifier }) => registryType === "npm" && identifier === packageManifest.name
);

if (packageManifest.mcpName !== serverManifest.name) {
  throw new Error(
    `package.json mcpName (${packageManifest.mcpName}) must match server.json name (${serverManifest.name})`
  );
}

if (registryPackage === undefined) {
  throw new Error(`server.json must declare the ${packageManifest.name} npm package`);
}

const versionsMatch =
  serverManifest.version === packageManifest.version && registryPackage.version === packageManifest.version;

if (checkOnly) {
  if (!versionsMatch) {
    throw new Error(
      `server.json versions (${serverManifest.version}, ${registryPackage.version}) must match package.json (${packageManifest.version})`
    );
  }
  process.exit(0);
}

serverManifest.version = packageManifest.version;
registryPackage.version = packageManifest.version;
await writeFile(serverPath, `${JSON.stringify(serverManifest, null, 2)}\n`);
