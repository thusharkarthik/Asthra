# Asthra Testing Strategy

Asthra uses focused package and service tests during the foundation stage.

## Package Testing Rules

- Every shared package should have a `tests/` directory.
- Tests should avoid network calls.
- Tests should avoid production databases.
- Tests should stay generic and business-agnostic.
- Mock external HTTP calls.

## Service Test Expectations

Each service should test:

- health endpoint
- readiness endpoint
- core CRUD behavior for its MVP scope
- validation behavior
- simple repository/service behavior where useful

SQLite test databases are acceptable for current MVP service tests.

## Shared Test Utilities

`packages/shared-test-utils` provides reusable helpers:

- SQLite test engine creation
- test session factory creation
- dummy auth headers
- success/error response assertions
- generic sample IDs and emails

Services can adopt these helpers later without changing service behavior.

## Running Tests

Run one service or package:

```bash
cd services/core-service
python3 -m pytest tests -q
```

Run discovered tests across services and packages:

```bash
scripts/run_all_tests.sh
```

The all-test script skips directories that do not have a `tests/` folder.
