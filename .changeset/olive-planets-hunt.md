---
"@archsmith/cli": patch
---

Removed the `diagram.authoring-notes.md` sidecar file `archsmith author` started writing in the previous release (issue #93). Nothing reads a persisted authoring note back today — not the CLI, the renderer, or the MCP server — and the only plausible future reader (editing an existing diagram) isn't designed yet, so committing to any storage format now risked a breaking change once that's actually built. `archsmith author` goes back to writing exactly two files (`.archsmith.json` + `.svg`).

The optional "why doesn't this apply here?" reason prompt for an absent Core Platform sub-layer is unchanged — still skippable, still shown back on the Review screen for the current session so you can see and confirm your own reasoning before finishing. It just isn't written anywhere once the session ends.
