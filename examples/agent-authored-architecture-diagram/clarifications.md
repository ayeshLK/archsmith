# Clarifications and review

The recorded agent invocation read [`requirement.md`](./requirement.md), called the published MCP server's live schema and registry discovery tools, summarized the schema's 5-column structure and governed sub-layers/colors, and then asked these questions.

## Agent questions

1. Inbound Actors: just employees uploading, or also client applications/browsers?
2. Malware Scan Flow: does the scan happen synchronously or asynchronously? Is the document stored before or after the scan clears it?
3. Metadata Extraction: a separate service/step, or combined with scanning?
4. Storage Architecture: what are the primary data stores (e.g. object store, database)?
5. Status Notification: who receives it, and is it one system or split by audience?
6. External Systems: is the malware scanner internal (Core Platform) or external (via Egress)?
7. Entity Layer: should the domain be modeled explicitly, or kept implicit?
8. Deployment Platform: what should `deployedOn` say?

## User answers

1. Use one inbound requester named **Employee Web App**, an internal browser SPA used by employees. Treat it as the Inbound Actor, not a Core Platform service.
2. Don't state or imply synchronous vs. asynchronous — the requirement doesn't specify this. Describe each step literally in the stated order: scan, extract, store, notify. No queue, retry, or timing mechanism.
3. Split into three separate services: **Document Intake Service**, **Malware Scan Coordinator**, and **Metadata Extraction Service**.
4. Use two separate, generically named Systems of Record: **Document Object Store** and **Metadata Database** — no vendor or product name.
5. Send status notifications only to the uploading employee, through one generic external **Notification Delivery Service**, reached via Egress.
6. The malware scanner is external — a generic **Malware Scanning Service**, reached via Egress, grouped into a clearly named generic cluster. Not labeled "third-party" or tied to a real vendor.
7. Omit the Entity Layer — there's no distinct domain abstraction worth modeling separately.
8. Use **Managed Application Runtime** for `deployedOn`.

Also: omit the Discovery and Governance sub-layer too, since nothing in the requirement describes a governance/policy component and inventing one to fill that layer would be fabricated content. Only Execution and Capability (the three services above) and Systems of Record (the two stores) are populated.

Title **Document Processing Platform — Architecture**, subtitle **Agent-authored example from a fictional plain-English requirement**, generic API Gateway labels for Ingress/Egress.

## Human review

The agent's first draft validated and rendered successfully on the first attempt, with no invented content: no fabricated governance component, no "third-party" framing of the malware scanner, no unstated synchronous/asynchronous claim, and no vendor-specific technology names. No corrections were needed this round — the prior recording's human-review findings (an invented Policy Enforcement Service, "third-party" framing, and an unsupported asynchronous claim) were folded into the answers given here up front, rather than caught after the fact.
