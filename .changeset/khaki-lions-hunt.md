---
"@archsmith/cli": minor
---

`archsmith author` now walks through External Systems after Egress, via a new `ExternalSystemsScreen` — a repeatable list of clusters, each itself a repeatable list of items using the shared `ItemSubFlow`. Submitting an empty cluster name ends the whole section, the same "empty submission ends the list" convention already used one level down for a cluster's own items — never a separate "add another cluster?" gate. This is the first genuinely nested repeatable list in the wizard (a list of lists), and reuses the existing `clusterNameDescriptor`/`clusterItemsAccessor` without needing any new draft-mutation machinery.
