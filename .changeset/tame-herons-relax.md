---
"@archsmith/renderer": minor
---

`render()` gains an additive `returnMeta` option: `render(ir, { returnMeta: true })` returns `{ svg, needsAcronym }` instead of just the SVG string, where `needsAcronym` lists the title of every item, across all three item columns (Inbound Actors, Core Platform, External Systems), whose title still didn't fit after wrapping to 2 lines with no `item.acronym` supplied. Threaded up through every intermediate layout function (`row`, `subLayer`, `corePlatform`, `inboundActors`, `externalSystems`) from the box-level signal added for issue #68. Existing callers are unaffected — `returnMeta` defaults to off, so `render(ir)` still returns a plain string.
