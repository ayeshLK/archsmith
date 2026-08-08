# Example Gallery

A set of fictional, generic fixtures that exercise different architecture shapes. Each example lives in its own folder with a `README.md`, `ir.json`, and rendered `diagram.svg` when applicable.

## Reference Fixtures

- [Event Ticket Booking Platform — Architecture](./ticket-booking/README.md)
- [Minimal Example — Architecture](./minimal-valid/README.md)

## Gallery Fixtures

- [Order Fulfillment Event Platform — Architecture](./event-driven-platform/README.md)
- [Nightly Data Pipeline — Architecture](./batch-etl-platform/README.md)
- [Customer Portal Web App — Architecture](./simple-3-tier-web-app/README.md)
- [Retail Commerce Platform — Multi-Region Architecture](./multi-region-platform/README.md)
- [Compliance Oversight Platform — Architecture](./compliance-heavy-platform/README.md)
- [API Gateway Front Door — Architecture](./gateway-first-platform/README.md)

## Broken Fixtures

- [Broken Fixtures README](./broken-examples/README.md)
- [`broken-examples/missing-subtitle.ir.json`](./broken-examples/missing-subtitle.ir.json)
- [`broken-examples/unknown-registry-id.ir.json`](./broken-examples/unknown-registry-id.ir.json)

## Regeneration

Render all gallery diagrams from the repo root with:

```bash
for example in examples/*/ir.json; do
  [ -f "$example" ] || continue
  node packages/cli/dist/index.js render "$example" -o "${example%/ir.json}/diagram.svg"
done
```
