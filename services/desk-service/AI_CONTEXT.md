# Desk Service Context

## Purpose

Service Management.

## Owned Data

- Tickets
- Incidents
- Requests
- SLAs
- Queues
- Ticket comments

## Not Owned Data

- Users
- Flow work items
- Docs pages
- Pulse service health metrics

## APIs

- Ticket CRUD
- Queue views
- Comments
- Status changes
- Reports

## Events Published

- TicketCreated
- TicketAssigned
- TicketResolved
- IncidentCreated

## Events Consumed

- Future Pulse incident events
- Future Flow relationship events

## RBAC Rules

- Use Desk permission codes such as `desk.ticket.view` and `desk.ticket.manage`.
- Resolve identity, membership, and scope through Core.

## UI Screens

- Desk Dashboard
- Tickets
- Ticket Detail
- Queues
- Reports

## Future Roadmap

- Escalation Rules
- Incident Collaboration Spaces
- Major Incident Management
