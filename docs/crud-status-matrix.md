# CRUD Status Matrix

This matrix summarizes beta CRUD readiness. It is a validation checklist, not a production certification.

| Service | Create | Read | Update | Delete | Known Gaps |
|---|---:|---:|---:|---:|---|
| Core | Partial | Yes | Partial | Partial | Identity/workspace source of truth; admin UX still limited |
| Flow | Yes | Yes | Yes | Yes | Lookup selectors and richer board UX pending |
| Docs | Yes | Yes | Yes | Yes | Rich editor and tree UX pending |
| Discover | Yes | Yes | Yes | Yes | Impact scoring UX and validation workflows pending |
| Desk | Yes | Yes | Yes | Yes | Queue/SLA workflows need deeper UI |
| Pulse | Yes | Yes | Yes | Partial | Realtime incident collaboration pending |
| Dev | Yes | Yes | Yes | Partial | Dependency graph and ownership editing pending |
| Collab | Yes | Yes | Yes | Yes | Realtime and reactions UX pending |
| Automation | Yes | Yes | Yes | Yes | No execution automation UI beyond foundation |
| Connect | Yes | Yes | Yes | Yes | No real external integrations |
| Guard | Yes | Yes | Yes | Partial | Policy enforcement and approvals pending |
| Insights | Yes | Yes | Yes | Yes | Advanced analytics and charts pending |
| Media | Yes | Yes | Yes | Yes | Metadata only; no file upload/OCR/transcription |

## Validation Checklist

For each service:

- Create endpoint exists for primary entity.
- Read/list endpoints exist for primary entity.
- Update endpoint exists where model supports mutation.
- Delete endpoint exists where safe.
- Tests cover basic route behavior.
- Frontend exposes at least MVP read/dashboard surfaces.

## Beta Gaps

- Cross-service persistence for favorites/recent items is not production-ready.
- Activity and notification systems are gateway-seeded for beta.
- Service-specific authorization is not fully propagated through every module UI.
