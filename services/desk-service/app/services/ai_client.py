from __future__ import annotations

import json

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class AIClient:
    def __init__(self, ai_service_url: str | None = None) -> None:
        self.ai_service_url = (ai_service_url or settings.ai_service_url or "").rstrip("/")

    def complete(self, prompt: str, *, system_prompt: str | None = None, request_id: str | None = None) -> dict:
        if not settings.ai_features_enabled or not self.ai_service_url:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI features are disabled or AI_SERVICE_URL is not configured.",
            )
        headers = {"X-Request-ID": request_id} if request_id else None
        try:
            response = httpx.post(
                f"{self.ai_service_url}/api/v1/completions/chat",
                json={"system_prompt": system_prompt, "messages": [{"role": "user", "content": prompt}]},
                headers=headers,
                timeout=20.0,
            )
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="AI Service timed out.") from exc
        except httpx.RequestError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI Service is unavailable.") from exc
        if response.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI Service request failed.")
        generated_text = response.json().get("generated_text", "")
        try:
            parsed = json.loads(generated_text)
            if isinstance(parsed, dict):
                return {**parsed, "raw_response": generated_text}
        except json.JSONDecodeError:
            pass
        return {"recommended_next_action": generated_text, "raw_response": generated_text}
