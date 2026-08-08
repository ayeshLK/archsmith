# Compliance Oversight Platform — Architecture

## Overview
Dense controls, long names, and many pills to stress wrapping and tag rendering.

## What It Shows
- Long titles that trigger wrapping pressure
- Dense semantic tags and abbreviations
- A layout intended to expose spacing and text regressions

## Files
- Diagram: [`diagram.svg`](./diagram.svg)
- IR: [`ir.json`](./ir.json)

## Regenerate
From the repo root, run:

```bash
node packages/cli/dist/index.js render examples/compliance-heavy-platform/ir.json -o examples/compliance-heavy-platform/diagram.svg
```
