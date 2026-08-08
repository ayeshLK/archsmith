# Customer Portal Web App — Architecture

## Overview
Small three-tier web application close to the schema floor.

## What It Shows
- A simple end-user entry point
- One execution service and two system-of-record boxes
- A clean, compact example for quick orientation

## Files
- Diagram: [`diagram.svg`](./diagram.svg)
- IR: [`ir.json`](./ir.json)

## Regenerate
From the repo root, run:

```bash
node packages/cli/dist/index.js render examples/simple-3-tier-web-app/ir.json -o examples/simple-3-tier-web-app/diagram.svg
```
