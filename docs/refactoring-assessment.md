# Refactoring assessment and proposed plan

Status: agreed plan. The maintainer approved the compatibility policy, package dependency graph, and delivery order on 2026-11-10.

Assessed 2026-11-10 against remote main `f5efaaa` (including PR #169), using an isolated checkout. The repository agent skills setup is tracked separately in PR #170.

## Baseline

Docker Node 24: `npm ci`, `npm run build`, `npm test`, and `npm run check:examples` passed. `npm audit --omit=dev --json` reported zero advisories. Node 20/22 and schema-site checks were not rerun for this assessment. This is a focused source assessment, not proof that every security defect has been found.

Existing strengths: strict TypeScript, governed registries, SVG text escaping, validation before rendering, real MCP client/transport tests, CLI subprocess tests, renderer fixtures, pinned workflow actions, CodeQL, workflow linting, and Node 20/22/24 CI.

## Findings

| Priority | Finding and evidence | Proposed change and verification |
| --- | --- | --- |
| High correctness | `packages/cli/src/author/acronymFixup.ts:34` matches title-only metadata to the next equal title. Reproduced with two long equal titles: first has acronym OLD, second has none. Real render flags one item; applying NEW changes the first to NEW and leaves the second unresolved. | Add item identity/path to render fixup metadata while preserving existing title metadata; use it in the wizard. Test actual render-to-fixup integration with partially flagged duplicate titles and all item locations. |
| High integrity | `packages/cli/src/author/screens/FinalStepScreen.tsx:132` writes JSON then SVG separately. Second-write failure leaves JSON behind; the error screen claims nothing was saved. Existence checks precede overwriting writes. Confirmed by source inspection; failure injection still needed. | Extract save orchestration; define partial-failure recovery and explicit overwrite policy. Stage outputs, use exclusive creation when overwrite was not approved, and report actual outcomes. Test real temporary directories, second-write failure, conflicts, and cleanup. A pair of renames is not an atomic two-file transaction. |
| Medium correctness | CLI `src/index.ts:123` and MCP `src/server.ts` use inherited-property membership for color families. Reproduced CLI `registries show colors --family constructor`: prints undefined and exits 0. | Use own-property lookup in both adapters; test constructor/toString, unknown and valid families through real CLI/MCP boundaries. |
| Medium standards | Root `package.json` lint delegates to absent workspace lint scripts; CI never runs source lint. | Adopt a small source-rule baseline and CI gate: MCP stdout discipline, promise handling, agreed import boundaries. Avoid unrelated formatting churn. Verify script changes on Node 20/22/24. |
| Medium architecture | AGENTS says every package only knows its immediate lower layer, but CLI/MCP deliberately import and declare schema. | Agree on and document the actual allowed dependency graph, then enforce it. Recommended: allow adapters to use renderer and schema; prohibit reverse dependencies. Do not introduce renderer proxies solely to match stale prose. |
| Medium resource hardening | MCP render store caps entry count at 20, with no byte cap; synchronous rendering and input collections/text have no work budgets. Source evidence: `renderStore.ts:18`, `server.ts:83`, diagram schema. Current transport is local stdio; no remote exploit demonstrated. | Define adapter input/work limits using measured examples; add retained-byte and single-entry limits, per-server store ownership, eviction and over-budget tests. Decide on cancellation/isolation only if measured cost warrants it. Keep transport limits distinct from governed schema contracts. |
| Low defense in depth | SVG serializer interpolates attribute values directly (`packages/renderer/src/svg/node.ts:24`). Text is escaped; inspected attributes are internal or governed. No user-controlled attribute exploit established. | Escape attribute values centrally; test quotes, ampersands, angle brackets, and normal numeric output. Preserve fixture output for ordinary values. |
| Lower maintainability | FinalStepScreen owns repeated assembly/validation/render preparation, prompts and filesystem writes; MCP tests use many any casts. | After correctness fixes, extract diagram preparation behind a small interface and typed MCP response helpers. Verify screen behavior using existing component tests and real PTY; avoid a generic workflow framework. |

## Proposed delivery sequence

1. Record the agreed dependency graph and compatibility rules in contributor/agent guidance. Introduce lint/import checks in a small PR.
2. Fix acronym identity and registry membership in separate PRs, each beginning with a failing regression test.
3. Extract and harden save orchestration; preserve prompt behavior, explicit overwrite approval and exit semantics. Include real filesystem failure tests and a compiled-binary PTY session.
4. Harden the serializer and MCP resource ownership/budgets in separate PRs. Establish budgets from actual workload measurements and test rejection/eviction behavior.
5. Reassess remaining duplication and type assertions. Refactor only boundaries whose complexity or change risk is supported by evidence.

For each code PR: appropriate changeset, monorepo build/test/example checks, standards checks, and focused regression tests. Use Node 20/22/24 for version-sensitive changes. Rendering changes additionally require regeneration and visual inspection of every affected example. Preserve MCP stdout, font measurement, governed registry contracts, archived schemas, and public exit codes. Prefer additive public API changes; do not build the future workflow/sequence seam without its own agreed scope.

## Agreed decisions

- Preserve existing behavior and public APIs; prefer additive API changes. Propose and justify breaking changes separately.
- CLI and MCP may depend directly on both schema and renderer. Renderer depends on schema; reverse dependencies remain prohibited.
- Start with automated standards enforcement and the demonstrated correctness/integrity defects before broader structural refactoring.

No domain terminology has changed, so this assessment does not create a glossary. No irreversible architectural choice has been agreed, so no ADR is proposed yet.
