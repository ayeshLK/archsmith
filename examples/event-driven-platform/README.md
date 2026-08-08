# Order Fulfillment Event Platform — Architecture

## Overview
Pub/sub-heavy backend with async workers and downstream consumers.

## What It Shows
- Event-driven execution rather than request/response-first design
- Multiple execution rows to show worker-oriented layout
- Several downstream clusters to exercise egress-heavy diagrams

## Files
- Diagram: [`diagram.svg`](./diagram.svg)
- IR: [`ir.json`](./ir.json)

## Regenerate
From the repo root, run:

```bash
node packages/cli/dist/index.js render examples/event-driven-platform/ir.json -o examples/event-driven-platform/diagram.svg
```
