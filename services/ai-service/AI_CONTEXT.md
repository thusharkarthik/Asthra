# AI Service Context

## Purpose

Intelligence orchestration foundation.

## Owned Data

- Completion request metadata
- Assistant sessions
- Assistant messages
- Assistant context records
- Assistant tool-call records

## Not Owned Data

- Source documents
- Memory chunks
- Work items
- Users

## APIs

- Completion endpoints
- Assistant session endpoints
- Assistant chat endpoints
- RAG completion endpoints where available

## Events Published

- CompletionGenerated
- AssistantSessionCreated
- AssistantMessageCreated
- AssistantResponseGenerated

## Events Consumed

- Future memory retrieval events
- Future platform context events

## RBAC Rules

- Intelligence endpoints must respect user scope and permissions.
- Read-only assistant behavior remains separate from autonomous execution.

## UI Screens

- Assistant surfaces
- Module intelligence action surfaces

## Future Roadmap

- Better provider orchestration
- Workspace-aware context
- Controlled action planning
