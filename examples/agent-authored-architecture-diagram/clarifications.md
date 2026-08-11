# Clarifications and review

The first recorded agent invocation read [`requirement.md`](./requirement.md), called the published MCP server's live schema and registry discovery tools, and then asked these questions.

## Agent questions

1. Should there be a single employee actor, or multiple actor types?
2. Is the web app part of the Core Platform, an External System, or the Inbound Actor?
3. Should all available Core Platform sub-layers be included, or should layers without a real counterpart be omitted?
4. Should malware scanning and metadata extraction be one combined service or separate services?
5. Should document and metadata storage be one combined store or separate Systems of Record items?
6. Where should the status notification be sent?
7. Are there external dependencies besides the notification destination?
8. Are acronyms needed for any long component names?

## User answers

1. Use one inbound requester named **Employee Web App**, an internal browser SPA used by employees.
2. Treat the web app as the Inbound Actor, not as a Core Platform service.
3. Initially include Discovery and Governance plus Execution and Capability; omit Entity Layer because there is no distinct domain abstraction. Systems of Record remains present.
4. Split processing into **Document Intake Service**, **Malware Scan Coordinator**, and **Metadata Extraction Service**.
5. Use separate **Document Object Store** and **Metadata Database** items.
6. Send status email through a generic external **Notification Delivery Service**, reached through egress.
7. The only other external dependency is a generic **Malware Scanning Service**, also reached through egress. Group the dependencies into clearly named generic clusters.
8. No acronyms are needed.

Use the title **Document Processing Platform — Architecture**, subtitle **Agent-authored example from a fictional plain-English requirement**, generic API Gateway labels, and `Managed Application Runtime` for `deployedOn`.

## Human review corrections

The first draft invented a Policy Enforcement Service to populate Discovery and Governance, called the malware provider third-party, and described the workflow as asynchronous. Those claims were absent from the requirement. The user corrected answer 3 to omit Discovery and Governance rather than fabricate content and requested literal descriptions only.

A second review removed an unsupported independent-scaling rationale and tightened these descriptions:

- Document Intake Service: `Receives document uploads`
- Malware Scan Coordinator: `Coordinates malware scanning`
- Notification Delivery Service: `Sends status email notifications`

The final note is limited to identifying this as a fictional recorded example. The agent then validated and rendered the corrected IR again.
