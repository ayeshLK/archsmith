# Retail Commerce Platform — Multi-Region Architecture

## Overview
Regional clusters with shared services and mirrored downstream dependencies.

## What It Shows
- Geography-aware layout with multiple downstream regions
- Shared control plane and duplicated operational concerns
- A larger example without being as dense as the compliance fixture

## Files
- Diagram: [`diagram.svg`](./diagram.svg)
- IR: [`ir.json`](./ir.json)

## Regenerate
From the repo root, run:

```bash
node packages/cli/dist/index.js render examples/multi-region-platform/ir.json -o examples/multi-region-platform/diagram.svg
```
