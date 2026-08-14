#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { Command } from "commander";
import { render, validate, type DiagramIR } from "@archsmith/renderer";
import { getDiagramSchema, getRegistry, listRegistryNames, type RegistryName } from "@archsmith/schema";

const packageManifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as { version: string };

const program = new Command();
program.name("archsmith").description("ArchSmith — layered architecture diagram tool").version(packageManifest.version);

function readIr(inputPath: string): unknown {
  let text: string;
  try {
    text = readFileSync(inputPath, "utf-8");
  } catch (err) {
    console.error(`archsmith: could not read ${inputPath}: ${(err as Error).message}`);
    process.exit(2);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`archsmith: ${inputPath} is not valid JSON: ${(err as Error).message}`);
    process.exit(2);
  }
}

function printValidationErrors(input: string, result: { errors: string[] }): void {
  console.error(`✗ ${input} is invalid (${result.errors.length} issue${result.errors.length === 1 ? "" : "s"}):`);
  for (const e of result.errors) console.error(`  - ${e}`);
}

/** Indents every line one level (2 spaces) except the opening `<svg ...>`
 * and closing `</svg>` lines — render()'s own output is already one
 * element per line (a presentation choice made in the renderer, not
 * touched here), so this is purely a readability aid for a caller who
 * wants the SVG's single top-level nesting level visually indented, e.g.
 * when diffing output by eye. Off by default so the file stays smaller. */
function prettyPrintSvg(svg: string): string {
  const lines = svg.split("\n");
  return lines.map((line, i) => (i === 0 || i === lines.length - 1 ? line : `  ${line}`)).join("\n");
}

program
  .command("validate <input>")
  .description("Validate an IR document against diagram-schema.json and the governed registries")
  .option("--json", "print machine-readable JSON output instead of text")
  .action((input: string, opts: { json?: boolean }) => {
    const ir = readIr(input);
    const result = validate(ir);
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.valid) {
      console.log(`✓ ${input} is valid`);
    } else {
      printValidationErrors(input, result);
    }
    process.exit(result.valid ? 0 : 1);
  });

program
  .command("render <input>")
  .description("Render an IR document to SVG")
  .requiredOption("-o, --out <path>", "output SVG file path")
  .option("--no-embed-fonts", "don't embed the bundled Arimo font in the output SVG (smaller file, but text may render differently on machines without it installed)")
  .option("--pretty", "indent the output SVG's element lines for readability (default is one element per line, unindented)")
  .action((input: string, opts: { out: string; embedFonts: boolean; pretty?: boolean }) => {
    const ir = readIr(input);

    // Validated explicitly here (rather than relying solely on render()'s
    // own default validate-first behavior) so an invalid IR gets the exact
    // same error listing and exit code (1) as `archsmith validate` — one
    // consistent failure mode across both commands, not two different
    // error-reporting styles for the same underlying problem.
    const validation = validate(ir);
    if (!validation.valid) {
      printValidationErrors(input, validation);
      process.exit(1);
    }

    let svg: string;
    try {
      svg = render(ir as DiagramIR, { skipValidate: true, embedFonts: opts.embedFonts });
    } catch (err) {
      console.error(`archsmith render: ${(err as Error).message}`);
      process.exit(2);
    }
    if (opts.pretty) svg = prettyPrintSvg(svg);
    writeFileSync(opts.out, svg, "utf-8");
    console.log(`wrote ${opts.out}`);
    process.exit(0);
  });

const registries = program.command("registries").description("Inspect the governed registries (sub-layers, colors, icons)");

registries
  .command("list")
  .description("List known registry names")
  .action(() => {
    for (const name of listRegistryNames()) console.log(name);
  });

registries
  .command("show <name>")
  .description("Print the raw contents of a registry")
  .option("--family <family>", "for the colors registry only, print just this family (e.g. standard, accessible) instead of all of them")
  .action((name: string, opts: { family?: string }) => {
    if (!listRegistryNames().includes(name as RegistryName)) {
      console.error(`archsmith: unknown registry "${name}". Known: ${listRegistryNames().join(", ")}`);
      process.exit(2);
    }
    const registry = getRegistry(name as RegistryName);
    if (opts.family === undefined) {
      console.log(JSON.stringify(registry, null, 2));
      return;
    }
    if (name !== "colors") {
      console.error(`archsmith: --family only applies to the "colors" registry, not "${name}"`);
      process.exit(2);
    }
    const families = (registry as { families: Record<string, unknown> }).families;
    if (!(opts.family in families)) {
      console.error(`archsmith: unknown color family "${opts.family}". Known: ${Object.keys(families).join(", ")}`);
      process.exit(2);
    }
    console.log(JSON.stringify(families[opts.family], null, 2));
  });

const schema = program.command("schema").description("Inspect the diagram IR JSON Schema");

schema
  .command("show")
  .description("Print the raw contents of diagram-schema.json")
  .action(() => {
    console.log(JSON.stringify(getDiagramSchema(), null, 2));
  });

program
  .command("author")
  .description("Guided, deterministic wizard for authoring a new diagram IR — no hand-written JSON")
  .action(async () => {
    // Dynamically imported so Ink/React only load when this subcommand
    // actually runs — every other command here stays as light as it's
    // always been.
    const { runAuthorCommand } = await import("./author/cli.js");
    await runAuthorCommand();
  });

program.parse();
