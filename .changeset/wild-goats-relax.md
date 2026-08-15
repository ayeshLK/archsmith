---
"@archsmith/cli": patch
---

Fixed `archsmith author`'s Ctrl+C handling: pressing Ctrl+C now actually shows "Nothing was saved — this doesn't persist yet" before exiting, instead of exiting silently with no message. Ink's `render()` defaults to `exitOnCtrlC: true`, which intercepts Ctrl+C at the framework level and unmounts directly — bypassing the app's own Ctrl+C handling and cancelled-state message entirely, and relying on the process exiting only because nothing else was left keeping the event loop alive. `cli.tsx` now passes `{ exitOnCtrlC: false }` so the app handles it manually, as Ink's own option is documented for.

This bug was invisible to the full `ink-testing-library` test suite, since that library's own `render()` already defaults `exitOnCtrlC: false` internally — it was only caught by running the real compiled binary interactively.
