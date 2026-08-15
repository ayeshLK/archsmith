---
"@archsmith/cli": minor
---

`archsmith author` now walks through Systems of Record after Core Platform's 3 governed sub-layers, via a new `SystemsOfRecordScreen` — the same shared repeatable-item-list shape as Inbound Actors, since Systems of Record is always required (real `minItems: 1`) and isn't gap-resolvable, unlike the optional sub-layers before it. Completing it now genuinely finishes the Core Platform section, which in turn makes Egress reachable for the first time — `GatewayScreen`, already built and tested for both gateways since the Ingress screen shipped, is now wired into the live sequence there too.
