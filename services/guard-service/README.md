# Asthra Guard Service

Asthra Guard is the security, governance, compliance, policy, and access-control visibility layer.

This MVP stores governance metadata and audit records only. It does not enforce access control, call AI services, or execute automation.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

Docker Compose publishes this service on `http://localhost:8012`.

## Tests

```bash
pytest tests
```

## Seed

```bash
python scripts/seed_guard_defaults.py
```

## Endpoint Groups

- Security policies: `/api/v1/security-policies`
- Access reviews: `/api/v1/access-reviews`
- Compliance checks: `/api/v1/compliance-checks`
- Audit events: `/api/v1/audit-events`
- Data retention policies: `/api/v1/data-retention-policies`
- Risk findings: `/api/v1/risk-findings`
- Security exceptions: `/api/v1/security-exceptions`

## Future Roadmap

Future tiers may add AI risk analysis, AI access review summaries, AI policy recommendations, compliance explanations, policy enforcement hooks, and cross-service security posture dashboards.
