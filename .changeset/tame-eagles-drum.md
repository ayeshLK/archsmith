---
"@archsmith/cli": minor
---

`archsmith author` now ends in a real save, not a placeholder — the final validate/render/save step, via a new `FinalStepScreen`. Confirming from Review assembles the draft, validates it, and if valid, prompts for a base file name (defaulting to a slug of the diagram's title) before writing `<name>.archsmith.json` and `<name>.svg` next to each other. An existing file at either path is never silently overwritten — you're asked to overwrite or choose a different name first. The completion screen states exactly where both files were saved and flags any Core Platform sub-layer still left pending. An assemble()/validate() failure (only reachable today via an empty required repeatable list, or a scalar left blank) is shown plainly with nothing written, since correcting one of those sections from here isn't supported yet — Ctrl+C remains the way out, same as any other screen.

This is the last screen in the section sequence — `App.tsx`'s "not yet built" placeholder is gone; every section now has a real screen. `archsmith author`'s post-session output no longer prints a raw JSON dump, since the completion screen (or Ctrl+C's own message) already says everything needed before exiting.
