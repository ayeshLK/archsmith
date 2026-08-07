#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { Command } from "commander";
import { render, validate, type DiagramIR } from "@archsmith/renderer";
import { getRegistry, listRegistryNames, type RegistryName } from "@archsmith/schema";

const program = new Command();
program.name("archsmith").description("ArchSmith — layered architecture diagram tool").version("0.1.0");

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
      console.error(`✗ ${input} is invalid (${result.errors.length} issue${result.errors.length === 1 ? "" : "s"}):`);
      for (const e of result.errors) console.error(`  - ${e}`);
    }
    process.exit(result.valid ? 0 : 1);
  });

program
  .command("render <input>")
  .description("Render an IR document to SVG")
  .requiredOption("-o, --out <path>", "output SVG file path")
  .action((input: string, opts: { out: string }) => {
    const ir = readIr(input);
    let svg: string;
    try {
      svg = render(ir as DiagramIR);
    } catch (err) {
      console.error(`archsmith render: ${(err as Error).message}`);
      process.exit(1);
    }
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
  .action((name: string) => {
    if (!listRegistryNames().includes(name as RegistryName)) {
      console.error(`archsmith: unknown registry "${name}". Known: ${listRegistryNames().join(", ")}`);
      process.exit(2);
    }
    console.log(JSON.stringify(getRegistry(name as RegistryName), null, 2));
  });

program.parse();
