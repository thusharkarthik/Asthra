from typing import Any

import httpx

from asthra_api_client.exceptions import APIClientResponseError, APIClientTimeoutError


class BaseAPIClient:
    def __init__(
        self,
        base_url: str,
        token: str | None = None,
        request_id: str | None = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.request_id = request_id
        self.timeout = timeout

    def _headers(self, extra_headers: dict[str, str] | None = None) -> dict[str, str]:
        headers: dict[str, str] = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if self.request_id:
            headers["X-Request-ID"] = self.request_id
        if extra_headers:
            headers.update(extra_headers)
        return headers

    def request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        json: Any = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        url = f"{self.base_url}/{path.lstrip('/')}"
        try:
            response = httpx.request(
                method=method,
                url=url,
                params=params,
                json=json,
                headers=self._headers(headers),
                timeout=self.timeout,
            )
        except httpx.TimeoutException as exc:
            raise APIClientTimeoutError("Request timed out.") from exc

        if response.status_code >= 400:
            try:
                body = response.json()
            except ValueError:
                body = response.text
            raise APIClientResponseError(
                status_code=response.status_code,
                message=f"API request failed with status {response.status_code}.",
                response_body=body,
            )

        if not response.content:
            return None
        try:
            return response.json()
        except ValueError:
            return response.text

    def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        return self.request("GET", path, params=params)

    def post(self, path: str, json: Any = None) -> Any:
        return self.request("POST", path, json=json)

    def patch(self, path: str, json: Any = None) -> Any:
        return self.request("PATCH", path, json=json)

    def delete(self, path: str) -> Any:
        return self.request("DELETE", path)
