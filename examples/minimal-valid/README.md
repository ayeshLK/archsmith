# Minimal Example — Architecture

## Overview
Smallest valid fixture in the repo. It exists as a smoke test for validation and rendering.

## What It Shows
- The minimum practical architecture shape that still validates
- A single simple execution box, one system of record, and one external service

## Files
- Diagram: [`diagram.svg`](./diagram.svg)
- IR: [`ir.json`](./ir.json)

## Regenerate
From the repo root, run:

```bash
node packages/cli/dist/index.js render examples/minimal-valid/ir.json -o examples/minimal-valid/diagram.svg
```
