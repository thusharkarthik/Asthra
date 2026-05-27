# Asthra Guard Service

Asthra Guard is the security, governance, compliance, policy, and access-control visibility layer for Asthra.

## Purpose

Guard centralizes security policies, access reviews, compliance checks, audit events, data retention rules, risk findings, and security exceptions. The MVP is focused on structured records and queryable APIs.

## Entities

- `SecurityPolicy`: workspace policy metadata and rules.
- `AccessReview`: access review campaign metadata and findings.
- `ComplianceCheck`: framework/control checks and evidence.
- `AuditEvent`: immutable-style audit event records.
- `DataRetentionPolicy`: retention rules by workspace and data type.
- `RiskFinding`: security risk findings and lifecycle status.
- `SecurityException`: approved or requested policy exceptions.

## Local Run

```bash
cd services/guard-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

With Docker Compose:

```bash
docker compose up --build guard-service
```

The service is published at `http://localhost:8012`.

## Tests

```bash
cd services/guard-service
pytest tests
```

## Future AI Roadmap

Later tiers may add AI risk analysis, access review summaries, policy recommendations, and compliance finding explanations. The MVP does not call `ai-service`.
