# @archsmith/cli

## 0.7.0

### Minor Changes

- c82f55a: Allow diagrams to omit the Legend block and let `archsmith author` persist an Include/Omit Legend choice. Schema 0.3.4 makes `legend` optional, and the renderer removes both the block and its unused footer space when absent.
- 872d3f1: Redesigned how Core Platform's governed sub-layers handle optionality (issue #89), grounded in real usage data: `execution-and-capability` appears in 100% of ArchSmith's own example diagrams, while `discovery-and-governance` and `entity-layer` are each absent from roughly half of them — the opposite of what the registry's own documentation implied.
  
  - **`@archsmith/renderer`**: `validate()` now requires `corePlatform.subLayers` to include an `execution-and-capability` entry, the same way `systemsOfRecord.registryId` is already checked — a plain, clearly-worded semantic check, not a JSON-Schema constraint (this codebase already rejected that approach once for producing unhelpful "must be equal to constant" errors). This is a real behavior change: a hand-authored or LLM-authored IR missing this sub-layer will now fail validation where it previously passed.
  - **`@archsmith/cli`**: `archsmith author`'s Core Platform screen now treats `execution-and-capability` as mandatory — no "doesn't apply"/"not sure" options, straight to adding its items, the same treatment `systemsOfRecord` already gets. `discovery-and-governance` and `entity-layer` stay optional and three-state, but selecting "No — doesn't apply" no longer forces a rendered "GAP — NOT IMPLEMENTED" box into the diagram. Instead, the layer is marked confirmed-absent via a draft-only marker (never part of the real IR), and an *optional* reason — skippable, like every other secondary field in the wizard — is recorded into a new sidecar `diagram.authoring-notes.md` file (written by `FinalStepScreen` for the first time) rather than into `unclassified`/the rendered SVG. The `authoringNotes.ts` sidecar mechanism itself was built back in Phase 1 for exactly this purpose but had never been wired into any screen until now.
  
  The renderer's own gap-note rendering capability is untouched — still correct for hand-authored/LLM-authored IR, where nothing walks the author through an explicit per-layer decision the way the wizard's interview does.
- 61c9711: `archsmith author` now walks through External Systems after Egress, via a new `ExternalSystemsScreen` — a repeatable list of clusters, each itself a repeatable list of items using the shared `ItemSubFlow`. Submitting an empty cluster name ends the whole section, the same "empty submission ends the list" convention already used one level down for a cluster's own items — never a separate "add another cluster?" gate. This is the first genuinely nested repeatable list in the wizard (a list of lists), and reuses the existing `clusterNameDescriptor`/`clusterItemsAccessor` without needing any new draft-mutation machinery.
- c188f2e: `archsmith author` now walks through Review after External Systems — every section shown in human terms, never a raw JSON dump, with any pending Core Platform sub-layer flagged clearly. From Review, editing Title/Subtitle/Deployed On, Ingress, or Egress jumps back into that section and returns to Review afterwards rather than continuing forward through the rest of the session. Jump-to-correct is intentionally offered only for those 3 scalar-only sections for now: the 4 repeatable-list sections (Inbound Actors, Core Platform's sub-layers and Systems of Record, External Systems) don't yet support re-entering a list in "append mode," so jumping back into one today would restart it from item 1 — that's deferred, not built here.
  
  Along the way: `IntroScreen` and `GatewayScreen` now pre-fill their text inputs from the draft's existing value instead of always starting blank, since Review is the first place either screen can be re-entered with real data already in it.
- 6ef3dc8: `archsmith author` now walks through the Ingress gateway after Inbound Actors, using a new `GatewayScreen` component (label → optional sublabel) shared between Ingress and Egress — one generic component parameterized by each column's own field descriptors, same "one factory, not two copies" pattern as the item sub-flow. Only Ingress is wired into the live navigation sequence for now: Core Platform sits between Ingress and Egress in the real section order and isn't built yet, so wiring Egress in today would be unreachable dead code. `GatewayScreen` itself is already tested against both gateways' descriptors directly.
- 98fa3ba: `archsmith author` now ends in a real save, not a placeholder — the final validate/render/save step, via a new `FinalStepScreen`. Confirming from Review assembles the draft, validates it, and if valid, prompts for a base file name (defaulting to a slug of the diagram's title) before writing `<name>.archsmith.json` and `<name>.svg` next to each other. An existing file at either path is never silently overwritten — you're asked to overwrite or choose a different name first. The completion screen states exactly where both files were saved and flags any Core Platform sub-layer still left pending. An assemble()/validate() failure (only reachable today via an empty required repeatable list, or a scalar left blank) is shown plainly with nothing written, since correcting one of those sections from here isn't supported yet — Ctrl+C remains the way out, same as any other screen.
  
  This is the last screen in the section sequence — `App.tsx`'s "not yet built" placeholder is gone; every section now has a real screen. `archsmith author`'s post-session output no longer prints a raw JSON dump, since the completion screen (or Ctrl+C's own message) already says everything needed before exiting.
- f4326a4: `archsmith author` now walks through Core Platform's 3 governed sub-layers (Discovery and Governance, Execution and Capability, Entity Layer) after Ingress, via a new `CorePlatformSubLayersScreen`. For each, you decide whether it applies ("Yes" walks the shared item sub-flow to add its boxes, "No" records a short gap note explaining the omission, "Not sure yet" skips it for now) — reusing `gapResolution.ts`'s existing done/absent/pending derivation rather than tracking a separate status. Systems of Record (a distinct, always-required section, not one of these optional sub-layers) isn't built yet, so navigation doesn't advance past Core Platform until it exists — the same "don't wire past what's built" scoping already used for Egress.
  
  Along the way: `subLayerItemsAccessor` now accepts an optional `registryId` to seed a brand-new sub-layer instance correctly on its first write (previously defaulted to an empty registryId), and a genuine `ink-select-input` bug was caught by the new component tests — its highlighted-option state persists across re-renders unless remounted, so re-showing the same decide prompt for the next sub-layer silently carried over the previous layer's cursor position. Fixed by keying the `SelectInput` on the current layer index, the same remount-per-step technique already used for `ItemSubFlow` across repeatable-list items.
- 30120cd: `archsmith author` can now resolve a title that doesn't fit even after wrapping to two lines (issue #67/#68). Once Review is confirmed, a dry-run render checks for any item render() flags via its `needsAcronym` signal; if any are found, a new screen asks for one short acronym per flagged title — skippable, leaving the renderer's own existing overflow handling in place for whatever's left unresolved — before proceeding to the normal Save step. Previously the wizard had no way to author `item.acronym` at all, despite this being planned as in-scope for v1 in the original design.
- 3a56a14: `archsmith author` now walks through Systems of Record after Core Platform's 3 governed sub-layers, via a new `SystemsOfRecordScreen` — the same shared repeatable-item-list shape as Inbound Actors, since Systems of Record is always required (real `minItems: 1`) and isn't gap-resolvable, unlike the optional sub-layers before it. Completing it now genuinely finishes the Core Platform section, which in turn makes Egress reachable for the first time — `GatewayScreen`, already built and tested for both gateways since the Ingress screen shipped, is now wired into the live sequence there too.
- dfc476e: `archsmith author` can now author `item.pill` (issue #97), grounded in real usage data: pills appear on Systems of Record items in 7/9 example diagrams (always `semantic: "primary"`) and on every External Systems item that has one at all (28/28, always `semantic: "viaEgress"`) — a real architectural differentiator, not a decorative option. Previously the only way to set a pill was hand-editing the saved `.archsmith.json`.
  
  Pill support differs by section, matching what the renderer actually does with it:
  
  - **Inbound Actors**: no pill step at all — `actorBox` has no rendering support for it, so there's nothing to guide anyone toward.
  - **Systems of Record / Core Platform sub-layers**: a free-text label (Enter to skip the pill entirely), then, if a label was given, a semantic picker over the 4 semantics that are ever meaningful outside External Systems (Primary, Warning, Highlight, Layer accent).
  - **External Systems**: a single yes/no ("Reached via the Egress gateway?"), no text entry — `renderExternalSystems` ignores `pill.semantic` entirely and always resolves the same color, and every real example uses the identical label text `"via egress"`, so there's no real choice to ask about.
  
  The pill step sits 2nd in `ItemSubFlow`, right after Title.
  
  While rebuilding this shared flow, `eyebrow` (already in the wizard) got the same data-first look: its 6 real uses across every example are 100% concentrated in Core Platform's `discovery-and-governance` sub-layer, never anywhere else. `ItemSubFlow`'s step order is now Title → Pill → Description → Eyebrow (previously Title → Eyebrow → Description → Color accent), and the Eyebrow step itself only appears for `discovery-and-governance` items — skipped for every other section, where an item's own sub-layer or section already tells you what kind of thing it is.
  
  Everything narrowed here is still reachable by hand-editing the saved JSON — the wizard guides toward the well-trodden path without removing any schema capability.
- 2a83329: `archsmith author` now walks through Inbound Actors after the intro screen, using a new reusable `ItemSubFlow` component (title → category → description lines → color accent) — the grouped multi-field pattern the earlier plan expected `ink-form` to provide, hand-built from `ink-select-input`/`ink-text-input` instead since `ink-form` turned out to be stale. The color picker only ever offers the real, governed color tokens (`purple`/`green`/`teal`/`amber`/`navy`/`mint`), checked directly against `registries/colors.json` and how the renderer's `resolveDotColor()` actually consumes this field. Submitting an empty title — on any item, including the first — ends the repeatable list rather than being treated as an empty item; an Inbound Actors section with zero items is left for `validate()` to catch, not duplicated here.
- 52351d2: First increment of `archsmith author` (issue #67, Phase 3): a real, running `archsmith author` command with its intro screen (title, subtitle, deployed-on) built on Ink, writing through the exact same Phase 1 field descriptors the headless engine already uses. Ink/React are dynamically imported inside this subcommand's action handler only — `archsmith render`/`validate`/`registries`/`schema` are completely unaffected and don't pay for them. A non-interactive invocation (piped stdin, CI) fails with one clear line and a non-zero exit rather than hanging; Ctrl+C prints an honest "nothing was saved" message, since this doesn't persist a draft yet. Most of the wizard (Inbound Actors, Ingress/Egress, Core Platform's sub-layers, External Systems, Review, and the assemble/validate/render finish) is still ahead — this is the first screen, not the finished command.

### Patch Changes

- c5f3224: Prevent `archsmith author` from advancing past unanswered required fields and empty required lists. Mandatory scalar prompts and repeatable sections now explain what is missing in place, while optional fields and additional-list termination keep their existing behavior.
- 8eb2766: Removed the `diagram.authoring-notes.md` sidecar file `archsmith author` started writing in the previous release (issue #93). Nothing reads a persisted authoring note back today — not the CLI, the renderer, or the MCP server — and the only plausible future reader (editing an existing diagram) isn't designed yet, so committing to any storage format now risked a breaking change once that's actually built. `archsmith author` goes back to writing exactly two files (`.archsmith.json` + `.svg`).
  
  The optional "why doesn't this apply here?" reason prompt for an absent Core Platform sub-layer is unchanged — still skippable, still shown back on the Review screen for the current session so you can see and confirm your own reasoning before finishing. It just isn't written anywhere once the session ends.
- d57134a: Fixed `archsmith author` rendering every Core Platform sub-layer's items as a vertical stack of one-item rows instead of paired columns (issue #88). `rowGrouping.ts`'s `suggestRowGrouping()` — written to produce the same 2-per-row pairing every real example uses — was never actually wired into any screen; adding items one at a time through `CorePlatformSubLayersScreen` always fell back to `subLayerItemsAccessor`'s one-item-per-row default, since that accessor only preserves an existing row shape on a same-count edit and has no way to know a list is "done." A new `applySuggestedRowGrouping()` re-groups a finished sub-layer's items into the real 2-2-1-style pairing once its item list ends, before advancing to the next sub-layer.
- d98a6ab: Changed `archsmith author`'s text-input prompt starter from `?` to `>` (issue #94) — the more familiar convention, consistent across every screen's `TextInput` prompt.
- b5ab04e: Fixed `archsmith author`'s Ctrl+C handling: pressing Ctrl+C now actually shows "Nothing was saved — this doesn't persist yet" before exiting, instead of exiting silently with no message. Ink's `render()` defaults to `exitOnCtrlC: true`, which intercepts Ctrl+C at the framework level and unmounts directly — bypassing the app's own Ctrl+C handling and cancelled-state message entirely, and relying on the process exiting only because nothing else was left keeping the event loop alive. `cli.tsx` now passes `{ exitOnCtrlC: false }` so the app handles it manually, as Ink's own option is documented for.
  
  This bug was invisible to the full `ink-testing-library` test suite, since that library's own `render()` already defaults `exitOnCtrlC: false` internally — it was only caught by running the real compiled binary interactively.
- Updated dependencies [c82f55a]
- Updated dependencies [872d3f1]
  - @archsmith/schema@0.8.0
  - @archsmith/renderer@0.10.0

## 0.6.3

### Patch Changes

- Updated dependencies [37f316f]
  - @archsmith/renderer@0.9.0

## 0.6.2

### Patch Changes

- Updated dependencies [49eb318]
  - @archsmith/renderer@0.8.0

## 0.6.1

### Patch Changes

- Updated dependencies [a69a384]
- Updated dependencies [5dc31e1]
- Updated dependencies [9b3203f]
- Updated dependencies [4e45a4e]
- Updated dependencies [4e45a4e]
  - @archsmith/schema@0.7.0
  - @archsmith/renderer@0.7.0

## 0.6.0

### Minor Changes

- 07796e4: Add a `get_schema` MCP tool and `archsmith schema show` CLI command so a tool-oriented agent or CLI user can discover the diagram IR's structural JSON Schema directly, without needing to read the `archsmith://schema` MCP resource. `render`/`validate` tool descriptions now point agents at `get_schema` and `get_registry` before authoring an IR, and their responses include the same pointer whenever the IR turns out to be invalid.

## 0.5.2

### Patch Changes

- 78eb2e1: Derive the CLI's reported version from package metadata so releases cannot drift from `archsmith --version`.
- Updated dependencies [05c4855]
  - @archsmith/schema@0.6.0
  - @archsmith/renderer@0.6.0

## 0.5.1

### Patch Changes

- 31c7af5: Add npm package metadata to improve discoverability and package page links.
- Updated dependencies [31c7af5]
  - @archsmith/renderer@0.5.1
  - @archsmith/schema@0.5.1

## 0.5.0

### Initial release

- `archsmith validate`, `archsmith render`, `archsmith registries list|show`.
