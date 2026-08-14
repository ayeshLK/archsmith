---
"@archsmith/cli": minor
---

`archsmith author` now walks through the Ingress gateway after Inbound Actors, using a new `GatewayScreen` component (label → optional sublabel) shared between Ingress and Egress — one generic component parameterized by each column's own field descriptors, same "one factory, not two copies" pattern as the item sub-flow. Only Ingress is wired into the live navigation sequence for now: Core Platform sits between Ingress and Egress in the real section order and isn't built yet, so wiring Egress in today would be unreachable dead code. `GatewayScreen` itself is already tested against both gateways' descriptors directly.
