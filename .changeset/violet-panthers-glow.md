---
"@archsmith/renderer": minor
---

Unified title-overflow/acronym handling across all three item box renderers (`actorBox`, `itemBox`, `clusterBox`) — previously only `clusterBox` (External Systems cluster members) capped wrapping at 2 lines, flagged an "ACRONYM NEEDED" pill, and let a supplied `item.acronym` substitute; `itemBox` (all four Core Platform sub-layers) wrapped titles with no line cap at all, and `actorBox` (Inbound Actors) never wrapped its title at all. All three now share one `layoutItemTitle()` function and behave identically. See issue #68.
