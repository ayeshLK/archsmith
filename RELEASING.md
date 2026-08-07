# Releasing ArchSmith

This is for whoever has npm publish rights to the `@archsmith` scope (holds the `NPM_TOKEN` secret configured on this repo). Regular contributors only need step 1 below — everything after that is a maintainer action.

## The short version

1. Every PR that changes something version-worthy adds a changeset (`npx changeset add`).
2. Cutting a release takes **two** manual runs of the Release workflow, with a PR merge in between:
   - **Run 1** turns the accumulated changesets into a "Version Packages" PR. Merge it.
   - **Run 2** (after merging) actually publishes to npm.

This two-run shape is deliberate, not a workaround: the workflow is `workflow_dispatch`-only (not triggered on every push), specifically so publishing is always an explicit action, never a side effect of merging a PR.

## Step by step

### 1. Add a changeset (every PR that needs a version bump)

```bash
npx changeset add
```

Walks you through: which package(s) changed, a bump type per package (`patch`/`minor`/`major`), and a one-line summary. Commit the resulting `.changeset/<random-name>.md` file alongside your code change — it sits there, unconsumed, until someone cuts a release.

Skip this for changes with no version-worthy effect on a published package (CI config, docs, examples) — deliberately, not by forgetting.

**Bump type, pre-1.0**: use `minor` for anything user-visible (a new capability, a schema/registry change) and `patch` for fixes. There's no real `major` yet since 1.0.0 hasn't happened — treat pre-1.0 `minor` as the practical "breaking or notable" signal.

### 2. Cut a release — run 1: generate the Version PR

```bash
gh workflow run release.yml --repo ayeshLK/archsmith
```

(Or: Actions tab → **Release** → **Run workflow**.)

With pending changesets present, this run bumps every affected package's version (see [Internal dependencies](#internal-dependencies-are-handled-automatically) below), updates each package's `CHANGELOG.md`, and opens (or updates) a PR named **"Version Packages"** with exactly those changes. Nothing gets published yet.

### 3. Review and merge the Version PR

It's just version bumps and changelog entries — check the bump types and changelog wording read sensibly, then merge normally. Merging it does **not** trigger anything by itself (no push trigger) — that's expected.

### 4. Cut a release — run 2: actually publish

```bash
gh workflow run release.yml --repo ayeshLK/archsmith
```

Same command, run again, now that the Version PR is merged. This time there are no pending changesets, so the version step is a no-op and the workflow goes straight to `npx changeset publish`: publishes every package whose current `package.json` version isn't already on npm (in dependency order), and pushes a `<package>@<version>` git tag + GitHub Release for each one it publishes.

### Verify it worked

```bash
npm view @archsmith/cli version
gh release list --repo ayeshLK/archsmith
```

## Internal dependencies are handled automatically

`.changeset/config.json` sets `"updateInternalDependencies": "patch"`. Concretely, verified against this repo's own packages: bumping `@archsmith/schema` by `minor` (e.g. `0.5.0` → `0.6.0`) automatically bumps `@archsmith/renderer` (which depends on it) by `patch`, *and* updates its dependency range from `^0.5.0` to `^0.6.0` — which cascades further to `@archsmith/cli`/`@archsmith/mcp-server`, since they depend on `renderer` too. All of that happens in the same `changeset version` run, with no manual editing.

This matters specifically because these are all `0.x` packages: npm's `^0.5.0` range means `>=0.5.0 <0.6.0` — the *minor* version is pinned pre-1.0, not just the major. A `patch` bump (`0.5.0` → `0.5.1`) stays inside that range and needs no dependent update; a `minor` bump crosses it and does. Changesets already accounts for this correctly — the manual dependency-range fixing the first release needed (going from `0.1.0` straight to `0.5.0`, bypassing changesets entirely) was a one-time consequence of *not* going through changesets, not something that recurs for a normal changeset-driven release.

## Why the first release (0.5.0) didn't follow this flow

Changesets only does *relative* bumps (patch/minor/major) — there's no changeset operation for "jump straight to 0.5.0" as an arbitrary starting version. The first release set all 4 `package.json` versions directly instead, with the internal dependency ranges fixed by hand (see [AGENTS.md](AGENTS.md#releasing) for the exact bugs that dry-run testing caught along the way). Every release since should go through the flow above — that one-time exception is not a pattern to repeat.

## If a bad version needs fixing

npm's unpublish policy is strict: a ~72-hour window, and the exact version number can never be reused again afterward even if you unpublish. Past that window, or for anything already depended on, publish a new patch with the fix rather than trying to remove the bad one.
