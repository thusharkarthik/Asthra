# Asthra Platform Status Matrix

| Service | Current Status | MVP Status | Integration Status | Future Enhancements |
| --- | --- | --- | --- | --- |
| api-gateway | Foundation | gateway info, registry, selected proxy routes | not yet required for all clients | auth validation, full routing, rate limits, service discovery |
| event-service | Foundation | event records, subscriptions, delivery log placeholders | not wired into services yet | Kafka/RabbitMQ, workers, retries, event-driven automation |
| core-service | Level 2 MVP | auth, organizations, workspaces, projects, users, roles | direct service and future gateway target | shared auth propagation, stronger RBAC |
| flow-service | MVP | work items, boards, comments, labels, attachments | direct service only | event publishing, gateway routing, sprint planning |
| docs-service | MVP | spaces, pages, comments, tags, basic search | direct service only | RAG indexing events, semantic search |
| ai-service | Foundation | provider abstraction, prompts, conversations, completions | direct service only | streaming, provider governance, model routing |
| memory-service | Foundation | sources, documents, chunking, placeholder embeddings, keyword retrieval | direct service only | vector DB, semantic retrieval, RAG workflows |
| discover-service | MVP | ideas, feedback, impact scoring, roadmap planning | direct service only | AI feasibility, competitor analysis |
| desk-service | MVP | tickets, queues, SLAs, incidents, approvals | direct service only | AI routing, duplicate detection, knowledge suggestions |
| pulse-service | MVP | alerts, incidents, on-call, status pages, postmortems | direct service only | anomaly detection, RCA assistance, automated updates |
| dev-service | MVP | repositories, PRs, deployments, releases, service catalog | direct service only | release risk, architecture insights |
| collab-service | MVP | threads, mentions, reactions, announcements, updates | direct service only | realtime, summaries, follow-up extraction |
| automation-service | Foundation | workflows, triggers, conditions, actions, executions | no real execution integrations yet | workers, triggers, agents, autonomous execution |
| connect-service | MVP | integrations, connectors, webhooks, sync jobs | placeholder connectors only | real integrations, retries, event bus delivery |
| guard-service | MVP | policies, reviews, compliance, audit events, risks | direct service only | policy enforcement, AI risk summaries |
| insights-service | MVP | dashboards, widgets, metrics, reports, events | no cross-service aggregation yet | operational dashboards, forecasting, anomaly detection |
| media-service | MVP | media assets, collections, transcripts, annotations, processing metadata | metadata only | OCR, transcription, multimodal embeddings |

## Known Integration Gaps

- Shared auth is not propagated across all services yet.
- Event publishing is not wired into service business flows yet.
- API Gateway routes only the first group of services.
- Observability helpers are packaged but not adopted in services yet.
- Frontend implementation has not started.
