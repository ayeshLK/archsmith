# Security Policy

## Supported versions

ArchSmith is pre-1.0 and its packages are versioned independently. Security fixes are provided for the latest published version of each `@archsmith/*` package only.

| Version | Supported |
|---|---|
| Latest npm release of each package | Yes |
| Older releases | No |

When reporting a vulnerability, verify it against the latest applicable package version. A fix may require coordinated releases across dependent packages or a new IR schema version.

## Reporting a vulnerability

Please report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/ayeshLK/archsmith/security/advisories/new). Do not open a public issue, pull request, or discussion for an unpatched vulnerability.

Include as much of the following as possible:

- the affected package, command, MCP tool, workflow, or schema URL;
- the package and Node.js versions used;
- impact and realistic attack scenario;
- minimal reproduction steps or proof-of-concept input;
- whether the issue is already public or actively exploited;
- any suggested remediation or disclosure constraints.

Reports that only contain scanner output without a reproducible impact may require additional information before they can be assessed.

## What to expect

ArchSmith is currently a maintainer-led project and does not promise a fixed response or remediation SLA. Reports will be reviewed as maintainer capacity allows. During investigation, maintainers may ask for clarification, validate the impact, prepare coordinated package releases, and agree on a disclosure timeline with the reporter.

Please keep the report and any related exploit details private until a fix is available and coordinated disclosure is agreed. Confirmed vulnerabilities may be published as GitHub security advisories with credit to the reporter unless they prefer otherwise.

## Security boundaries

ArchSmith treats diagram IR documents, CLI arguments, MCP tool inputs, and generated SVG content as untrusted data. The renderer is deterministic and does not call an LLM or remote service. The MCP server currently uses stdio transport and does not provide a network authentication boundary.

Ordinary rendering defects, feature requests, and documentation problems should be reported through [public GitHub issues](https://github.com/ayeshLK/archsmith/issues). Dependency-only findings with no demonstrated ArchSmith impact may be handled through routine dependency updates rather than a security advisory.
