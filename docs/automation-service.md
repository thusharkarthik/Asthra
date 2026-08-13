# Asthra Automate Service

Asthra Automate is the workflow automation and orchestration layer for Asthra. It coordinates trigger definitions, condition checks, ordered actions, manual execution, scheduled jobs, and audit history.

## Workflow Model

- `Workflow`: workspace-scoped automation definition with draft, active, paused, or archived status.
- `WorkflowTrigger`: activation definition such as `manual`, `work_item_created`, `page_updated`, or `ticket_created`.
- `WorkflowCondition`: placeholder condition rules for future evaluation logic.
- `WorkflowAction`: ordered placeholder action definitions such as `create_notification`, `create_comment`, `send_webhook_placeholder`, and `update_status_placeholder`.
- `WorkflowExecution`: synchronous execution record with status and execution log.
- `ScheduledJob`: schedule metadata for future background runners.
- `AutomationAuditLog`: audit trail for workflow changes and executions.

## Execution Lifecycle

1. A workflow is created for a workspace.
2. Triggers, conditions, and actions are attached.
3. Manual execution validates the workflow.
4. Conditions are evaluated with placeholder logic.
5. Actions are executed as placeholders in order.
6. Execution and audit logs are recorded.

No background workers, external integrations, agents, or AI calls are part of this foundation MVP.

## Local Run

```bash
cd services/automation-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

With Docker Compose from the repository root:

```bash
docker compose up --build automation-service
```

The service is published at `http://localhost:8010`.

## Tests

```bash
cd services/automation-service
pytest tests
```

## Future Agent Roadmap

Future tiers may add AI workflow generation, AI condition suggestions, automation recommendations, agent orchestration, autonomous execution, real schedules, external connectors, retries, and approval gates.
