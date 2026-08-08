# @archsmith/cli

The `archsmith` command-line tool for [ArchSmith](https://github.com/ayeshLK/archsmith) — render and validate layered architecture diagrams from a JSON IR.

See the [root README](https://github.com/ayeshLK/archsmith#readme) for what ArchSmith is and what the IR looks like.

## Install

```bash
npm install -g @archsmith/cli
```

## Usage

The recommended filename pattern is `*.archsmith.json`, which allows editors and integrations to recognize ArchSmith documents reliably. The CLI accepts any JSON file path.

```bash
archsmith validate <input.archsmith.json> [--json]
archsmith render <input.archsmith.json> -o <out.svg> [--no-embed-fonts] [--pretty]
archsmith registries list
archsmith registries show <sub-layers|colors|icons> [--family standard|accessible]
```

- `render` validates the IR first and fails the same way `validate` would (exit 1) if it's invalid; a rendering-time error exits 2.
- `--no-embed-fonts` skips embedding the bundled font, producing a smaller file.
- `--pretty` indents the output SVG's element lines for readability (default is one element per line, unindented).
- `registries show colors --family standard` prints just that color family instead of the whole registry.

## License

Apache-2.0
