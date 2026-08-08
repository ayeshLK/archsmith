# API Gateway Front Door — Architecture

## Overview
Ingress and external dependencies dominate, with minimal core business logic.

## What It Shows
- A thin core with the gateway as the main structural element
- Outbound dependencies that matter more than internal branching
- A front-door-first platform shape

## Files
- Diagram: [`diagram.svg`](./diagram.svg)
- IR: [`ir.json`](./ir.json)

## Regenerate
From the repo root, run:

```bash
node packages/cli/dist/index.js render examples/gateway-first-platform/ir.json -o examples/gateway-first-platform/diagram.svg
```
