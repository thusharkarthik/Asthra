# Guard Service Context

## Purpose

Governance and Security.

## Owned Data

- Audit Logs
- Security Events
- Compliance Controls

## Not Owned Data

- Core role source records
- Product module business data
- Files

## APIs

- Audit log views
- Security event views
- Compliance controls
- Policy views

## Events Published

- AuditLogCreated
- SecurityEventCreated
- ComplianceControlUpdated

## Events Consumed

- Future audit events from platform services
- Future security events

## RBAC Rules

- Use Guard permission codes such as `guard.audit.view`.
- Guard data is sensitive and should default to restricted visibility.

## UI Screens

- Guard Dashboard
- Audit
- Security
- Compliance

## Future Roadmap

- Risk Engine
- Compliance Reporting
