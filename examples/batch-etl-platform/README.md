# Nightly Data Pipeline — Architecture

## Overview
Batch ingestion, transformation, and load path with a stronger downstream emphasis.

## What It Shows
- ETL-style flow with a small number of inbound entry points
- Batch jobs rather than interactive services
- Downstream warehouses and retention targets

## Files
- Diagram: [`diagram.svg`](./diagram.svg)
- IR: [`diagram.archsmith.json`](./diagram.archsmith.json)

## Regenerate
From the repo root, run:

```bash
node packages/cli/dist/index.js render examples/batch-etl-platform/diagram.archsmith.json -o examples/batch-etl-platform/diagram.svg
```
