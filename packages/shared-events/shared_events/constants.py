class EventNames:
    CORE_ORGANIZATION_CREATED = "core.organization.created"
    CORE_WORKSPACE_CREATED = "core.workspace.created"
    CORE_PROJECT_CREATED = "core.project.created"
    FLOW_WORK_ITEM_CREATED = "flow.work_item.created"
    FLOW_WORK_ITEM_UPDATED = "flow.work_item.updated"
    DOCS_PAGE_CREATED = "docs.page.created"
    DOCS_PAGE_UPDATED = "docs.page.updated"
    AI_COMPLETION_GENERATED = "ai.completion.generated"
    AI_ASSISTANT_SESSION_CREATED = "ai.assistant.session.created"
    AI_ASSISTANT_MESSAGE_CREATED = "ai.assistant.message.created"
    AI_ASSISTANT_RESPONSE_GENERATED = "ai.assistant.response.generated"
    MEMORY_DOCUMENT_CREATED = "memory.document.created"
    MEMORY_DOCUMENT_CHUNKED = "memory.document.chunked"
    MEMORY_DOCUMENT_INGESTED = "memory.document.ingested"
    MEMORY_EMBEDDING_GENERATED = "memory.embedding.generated"
    MEMORY_WORKSPACE_SEARCH = "memory.workspace.search"
    DISCOVER_IDEA_CREATED = "discover.idea.created"
    DESK_TICKET_CREATED = "desk.ticket.created"
    PULSE_INCIDENT_CREATED = "pulse.incident.created"
    AUTOMATION_WORKFLOW_EXECUTED = "automation.workflow.executed"


COMMON_EVENT_NAMES = {
    EventNames.CORE_ORGANIZATION_CREATED,
    EventNames.CORE_WORKSPACE_CREATED,
    EventNames.CORE_PROJECT_CREATED,
    EventNames.FLOW_WORK_ITEM_CREATED,
    EventNames.FLOW_WORK_ITEM_UPDATED,
    EventNames.DOCS_PAGE_CREATED,
    EventNames.DOCS_PAGE_UPDATED,
    EventNames.AI_COMPLETION_GENERATED,
    EventNames.AI_ASSISTANT_SESSION_CREATED,
    EventNames.AI_ASSISTANT_MESSAGE_CREATED,
    EventNames.AI_ASSISTANT_RESPONSE_GENERATED,
    EventNames.MEMORY_DOCUMENT_CREATED,
    EventNames.MEMORY_DOCUMENT_CHUNKED,
    EventNames.MEMORY_DOCUMENT_INGESTED,
    EventNames.MEMORY_EMBEDDING_GENERATED,
    EventNames.MEMORY_WORKSPACE_SEARCH,
    EventNames.DISCOVER_IDEA_CREATED,
    EventNames.DESK_TICKET_CREATED,
    EventNames.PULSE_INCIDENT_CREATED,
    EventNames.AUTOMATION_WORKFLOW_EXECUTED,
}
