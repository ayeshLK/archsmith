---
"@archsmith/cli": minor
---

First increment of `archsmith author` (issue #67, Phase 3): a real, running `archsmith author` command with its intro screen (title, subtitle, deployed-on) built on Ink, writing through the exact same Phase 1 field descriptors the headless engine already uses. Ink/React are dynamically imported inside this subcommand's action handler only — `archsmith render`/`validate`/`registries`/`schema` are completely unaffected and don't pay for them. A non-interactive invocation (piped stdin, CI) fails with one clear line and a non-zero exit rather than hanging; Ctrl+C prints an honest "nothing was saved" message, since this doesn't persist a draft yet. Most of the wizard (Inbound Actors, Ingress/Egress, Core Platform's sub-layers, External Systems, Review, and the assemble/validate/render finish) is still ahead — this is the first screen, not the finished command.
