from typing import Any

import httpx

from app.providers.base_provider import BaseProvider, ProviderError, ProviderTimeoutError


class OpenRouterProvider(BaseProvider):
    def generate_completion(
        self,
        *,
        messages: list[dict[str, str]],
        system_prompt: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        request_messages = self._build_messages(messages, system_prompt)
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": request_messages,
        }
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        try:
            response = httpx.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ProviderTimeoutError("OpenRouter request timed out.") from exc
        except httpx.HTTPError as exc:
            raise ProviderError(f"OpenRouter request failed: {exc}") from exc

        return self._parse_response(response.json())

    def health_check(self) -> bool:
        return bool(self.api_key)

    def _build_messages(
        self,
        messages: list[dict[str, str]],
        system_prompt: str | None,
    ) -> list[dict[str, str]]:
        if not system_prompt:
            return messages
        return [{"role": "system", "content": system_prompt}, *messages]

    def _parse_response(self, payload: dict[str, Any]) -> dict[str, Any]:
        choices = payload.get("choices") or []
        message = choices[0].get("message", {}) if choices else {}
        usage = payload.get("usage") or {}
        return {
            "generated_text": message.get("content", ""),
            "usage": {
                "prompt_tokens": usage.get("prompt_tokens"),
                "completion_tokens": usage.get("completion_tokens"),
                "total_tokens": usage.get("total_tokens"),
            },
        }
