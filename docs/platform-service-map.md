# Asthra Platform Service Map

Asthra is organized as a modular service suite. Each service owns a clear product boundary and keeps its MVP implementation independent while sharing common platform standards.

| Service | Suite Name | Current Status | MVP Scope | Future Scope |
| --- | --- | --- | --- | --- |
| api-gateway | Asthra API Gateway | Foundation MVP | health, readiness, service registry, request IDs, selected proxy routes | auth validation, rate limits, service discovery, cache integration, full routing |
| event-service | Asthra Event Bus | Foundation MVP | event envelope storage, subscriptions, placeholder delivery logs | Kafka/RabbitMQ/Redis Streams, automation triggers, cache invalidation, AI indexing |
| core-service | Asthra Core | Level 2 foundation MVP | users, organizations, workspaces, teams, projects, roles, permissions, activity, invitations, settings, notifications, API keys | shared auth propagation, tenant policy enforcement, service identity |
| flow-service | Asthra Flow | MVP implemented | work items, boards, comments, labels, attachments metadata | sprints, roadmap workflows, dependency mapping, AI task assistance |
| docs-service | Asthra Docs | MVP implemented | spaces, pages, versions, comments, tags, attachments metadata, basic search | semantic search, RAG-ready indexing, collaborative editing |
| ai-service | Asthra Intelligence | Foundation MVP | provider abstraction, prompts, conversations, completions API | model routing, streaming, tool use, agents, governance |
| memory-service | Asthra Memory | Foundation MVP | sources, documents, chunking, placeholder embeddings, keyword retrieval | vector DB, semantic retrieval, RAG integration, memory policies |
| discover-service | Asthra Discover | MVP implemented | ideas, feedback, feature requests, impact scores, validation notes, MVP plans, roadmap items | AI research support, opportunity scoring, portfolio planning |
| desk-service | Asthra Desk | MVP implemented | tickets, queues, SLAs, approvals, incidents, escalations, change requests | AI routing, knowledge suggestions, service catalog workflows |
| pulse-service | Asthra Pulse | MVP implemented | alerts, incidents, timelines, on-call schedules, escalation policies, status pages, postmortems | anomaly detection, incident summaries, reliability intelligence |
| dev-service | Asthra Dev | MVP implemented | repositories, pull requests, deployments, releases, environments, service catalog | architecture insights, release risk, dependency intelligence |
| collab-service | Asthra Collab | MVP implemented | threads, messages, mentions, reactions, announcements, activity stream, team updates | realtime collaboration, summaries, meeting follow-ups |
| automation-service | Asthra Automate | Foundation MVP | workflows, triggers, conditions, actions, executions, schedules, audit logs | background workers, event triggers, agent orchestration |
| connect-service | Asthra Connect | MVP implemented | integrations, connectors, webhooks, event subscriptions, sync jobs, API connections | real connectors, event bus delivery, retry queues |
| guard-service | Asthra Guard | MVP implemented | policies, access reviews, compliance checks, audit events, retention policies, risk findings | policy enforcement, AI risk analysis, compliance automation |
| insights-service | Asthra Insights | MVP implemented | dashboards, widgets, metrics, reports, insight events, usage metrics | cross-service analytics, forecasting, AI executive summaries |
| media-service | Asthra Media | MVP implemented | media assets, collections, transcripts, annotations, processing jobs, tags | OCR, transcription, image understanding, multimodal embeddings |
