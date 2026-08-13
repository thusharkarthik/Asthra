# Asthra Error Codes

Asthra services should use stable, readable error codes.

## Common Codes

| Code | Meaning |
| --- | --- |
| `validation_error` | Request payload or query params are invalid |
| `not_found` | Requested resource does not exist or is inaccessible |
| `conflict` | Request conflicts with existing state |
| `permission_denied` | Caller lacks required access |
| `unauthenticated` | Caller is not authenticated |
| `service_unready` | Service dependency or database is unavailable |
| `downstream_unavailable` | Downstream service could not be reached |
| `internal_error` | Unhandled server error |

## Rules

- Do not expose secrets or stack traces in API errors.
- Include validation details when safe.
- Prefer stable codes over human-message parsing.
- Keep messages concise and actionable.
