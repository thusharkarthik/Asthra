# Assistant Tool Registry

The Assistant Tool Registry defines read-only placeholder tools that Asthra Assistant can reference and track.

## Current Tools

| Tool | Purpose | Mutation Allowed |
| --- | --- | --- |
| `memory_search` | Search indexed workspace memory | No |
| `docs_lookup` | Look up documentation context | No |
| `flow_lookup` | Look up work management context | No |
| `discover_lookup` | Look up discovery context | No |
| `desk_lookup` | Look up service desk context | No |

## Behavior

Tools currently return placeholder results and do not call downstream services directly. Tool usage is recorded in `AssistantToolCall` for transparency and future auditability.

## Rules

- Tools are read-only.
- Tools do not mutate service records.
- Tools do not trigger automation.
- Tools do not execute external integrations.
- Missing tools return a safe placeholder response.

## Future Roadmap

- Add real read-only lookup adapters.
- Add authorization-aware service calls through the API Gateway.
- Add approval-gated mutations in a future agent tier.
- Add tool execution policies and audit reports.
