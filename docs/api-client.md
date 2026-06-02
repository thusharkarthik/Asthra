# Asthra API Client

`packages/api-client` provides lightweight Python clients for selected Asthra services.

## Purpose

The API client package is intended for future:

- internal scripts
- developer tools
- smoke tests
- service-to-service experiments
- local integration checks

It is not wired into existing services yet.

## Current Clients

- `CoreClient`
- `FlowClient`
- `DocsClient`
- `AIClient`
- `MemoryClient`

Each client extends `BaseAPIClient`, which supports:

- base URL configuration
- bearer token auth header
- `X-Request-ID`
- request timeout
- clean client exceptions

## Example

```python
from asthra_api_client import CoreClient

client = CoreClient(
    base_url="http://localhost:8000",
    token="dev-token",
    request_id="req-123",
)

projects = client.list_projects(workspace_id=1)
```

## Testing

Tests must mock HTTP calls. Package tests must not require live Asthra services.

```bash
cd packages/api-client
python3 -m pytest tests -q
```

## Future Usage

Later work can add additional clients for Discover, Desk, Pulse, Dev, Collab, Automate, Connect, Guard, Insights, Media, Event Service, and API Gateway.
