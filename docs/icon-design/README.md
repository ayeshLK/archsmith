# Item icon design evaluation (issue #6)

**Status: approved and implemented for issue #6.** The baseline and token mapping were approved before production changes. The ticket-booking prototype then received visual approval before the remaining examples were migrated. The implementation, all valid example updates, and the export licensing handoff are included in [PR #162](https://github.com/ayeshLK/archsmith/pull/162).

See [gallery.svg](gallery.svg) for the six-token visual comparison. The gallery places candidates at 16px and 64px on their source viewBoxes. [alternatives.svg](alternatives.svg) compares additional same-baseline candidates for weak fits. The approved production mapping and treatment are recorded below and implemented in the governed registry.

## Candidates and provenance

### Baseline: Google Material Symbols, Outlined

Pinned repository revision: [`10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7`](https://github.com/google/material-design-icons/tree/10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7). The primary comparison uses `person`, `policy`, `deployed_code`, `data_object`, `database`, and `open_in_new`; the supplemental comparison adds `hub`, `api`, `account_tree`, and `public`. Upstream source files follow `symbols/web/<name>/materialsymbolsoutlined/<name>_24px.svg` at that revision. The set is distributed under [Apache License 2.0](https://github.com/google/material-design-icons/blob/10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7/LICENSE); the upstream README describes Material Symbols, their variants, and permissive remix/redistribution terms ([README](https://github.com/google/material-design-icons/blob/10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7/README.md)). Upstream has no NOTICE file at this revision. The SVGs are filled silhouettes in a 960-unit viewBox, not literal 2px stroke outlines. The comparison extracts source path geometry into a self-contained SVG while preserving path data and source proportions; only specimen viewBox/size and display color are set by the gallery. No upstream geometry has been modified. Any future normalization or geometry edit must be documented as a modified file and retain attribution/license notices.

### Comparison: IBM Carbon icons

Pinned repository revision: [`acc2c77d01f7e8d89f81a1a83402a28f7e6542f0`](https://github.com/carbon-design-system/carbon-icons/tree/acc2c77d01f7e8d89f81a1a83402a28f7e6542f0). Candidate names: `user`, `security`, `services`, `data`, `storage`, and `launch`, from [`src/svg`](https://github.com/carbon-design-system/carbon-icons/tree/acc2c77d01f7e8d89f81a1a83402a28f7e6542f0/src/svg). The repository is Apache-2.0 ([LICENSE](https://github.com/carbon-design-system/carbon-icons/blob/acc2c77d01f7e8d89f81a1a83402a28f7e6542f0/LICENSE.md)); its source tree has no NOTICE file. Carbon’s SVG collection uses varied viewBoxes and filled geometry. The candidates are shown without semantic edits; fitting their viewBoxes to a common box is a display transform only.

### Original ArchSmith gap candidates

The bottom row tests original, color-free concepts rather than vendored third-party artwork: `entity-record` is a compact record card (structured entity), `external-world` is a globe with an outbound arrow, and `governance-shield` is a shield with a check. The record-card is the approved production geometry for `entity`; the other two remain comparison-only alternatives.

## License and generated-SVG implications

Both external sources identify Apache-2.0 licensing in their upstream repositories. Under [Apache-2.0 §4](https://www.apache.org/licenses/LICENSE-2.0), redistribution requires recipients to receive a copy of the license, modified files to carry prominent modification notices, and any upstream NOTICE contents to be included when applicable. Neither pinned source repository contains a NOTICE file. Exporting or copying SVG geometry into a generated or vendored SVG does not remove the licensing obligation. The renderer adds SVG `<metadata>` whenever a Material-derived token is used: it identifies the pinned revision and symbols used, notes that the geometry was redrawn, and includes the complete Apache-2.0 license text. Renderer library results, CLI files, and MCP SVG responses all use this renderer output, so they carry the same handoff. Preserve that metadata when redistributing the SVG or its marked icon geometry. Published packages also include the license file and provenance notices. Google says attribution is not required, but recording it remains useful provenance. This is a source review, not legal advice.

## Assessment and recommendation

| Token | Material Symbols candidate | Carbon candidate | Assessment |
| --- | --- | --- | --- |
| actor | `person` | `user` | Both immediately read as a person; Material’s silhouette is clean at 16px. |
| governance | `policy` | `security` | Material’s policy/shield motif conveys governance; Carbon’s lock reads as security/access control. |
| service | `deployed_code` | `services` | Material’s cube is compact but deployment-specific; Carbon’s cluster is detailed. Supplemental Material `hub` is a plausible service-network mark; `api` is compact but abstract. |
| entity | `data_object` | `data` | Neither is ideal: braces suggest code; Carbon’s dashboard suggests analytics. Supplemental `account_tree` reads as hierarchy, not a domain entity. Original record-card is clearer. |
| data-store | `database` | `storage` | Both use a recognizable database cylinder; Material is the simpler small-size candidate. |
| external | `open_in_new` | `launch` | Both indicate opening externally rather than an external system. Supplemental Material `public` globe is a stronger candidate for an external system. |

Recommendation, now approved: use **Material Symbols Outlined as the single external baseline**, with `person` (actor), `policy` (governance), `hub` (service), an original ArchSmith record-card (entity), `database` (data-store), and `public` (external). The Material sources are redrawn into numeric allow-listed geometry: circle, ellipse, line, polyline, and rounded rectangle. Registry coordinates use a 24×24 viewBox; the 3-unit source stroke scales to a 2px visible stroke at the standard 16px display size. Shape/color/markup are kept separate. `entity` is original ArchSmith geometry. The source-inspired geometry is substantially modified from the Material filled silhouettes; that modification is recorded in the registry and published package notices. Carbon remains comparison-only because its candidates are less semantically consistent across this token set.

The production redraws simplify the source silhouettes into these semantic marks: `person` becomes an outlined head and shoulder contour; `policy` becomes a shield and check; `hub` becomes five connected service nodes; `database` becomes a simple three-tier cylinder; and `public` becomes a wire globe with meridians and latitude lines. The `entity` record-card is original geometry. The research gallery itself retains the upstream geometry unchanged; the production registry contains the documented redraws.

## Approval record

1. **Source and design approval:** the maintainer approved Material Symbols Outlined as the baseline, the six-token mapping in this document, and the normalized outline treatment after reviewing the gallery and supplemental alternatives. Approval was recorded in the maintainer work session before production registry or renderer changes; the issue thread contains the agreed implementation plan but no separate approval comment to link.
2. **Prototype visual approval:** the maintainer reviewed and approved the rendered [ticket-booking SVG](../../examples/ticket-booking/diagram.svg) and its [IR](../../examples/ticket-booking/diagram.archsmith.json) before migration of the remaining valid examples.

The final rollout migrated all nine valid examples and regenerated their SVGs. Their rendered output was visually inspected after regeneration. Broken fixtures were updated to reference schema 0.3.6 while retaining their intended validation failures. The design gallery remains a source-evaluation artifact; production geometry is the documented, allow-listed redraw in `packages/schema/registries/icons.json`.
