---
"@archsmith/cli": patch
---

Prevent `archsmith author` from advancing past unanswered required fields and empty required lists. Mandatory scalar prompts and repeatable sections now explain what is missing in place, while optional fields and additional-list termination keep their existing behavior.
