from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_provider import AIProvider
from app.models.ai_request_log import AIRequestLog
from app.providers.base_provider import BaseProvider, ProviderError, ProviderTimeoutError
from app.providers.groq_provider import GroqProvider
from app.providers.openrouter_provider import OpenRouterProvider
from app.schemas.completion import ChatCompletionRequest, ChatCompletionResponse, TokenUsage


@dataclass
class ResolvedProvider:
    record: AIProvider
    adapter: BaseProvider


class ProviderService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def generate_chat_completion(
        self,
        completion_request: ChatCompletionRequest,
    ) -> ChatCompletionResponse:
        resolved_provider = self.resolve_provider(
            provider_name=completion_request.provider,
            model_name=completion_request.model,
        )
        messages = [message.model_dump() for message in completion_request.messages]

        started_at = perf_counter()
        try:
            result = resolved_provider.adapter.generate_completion(
                messages=messages,
                system_prompt=completion_request.system_prompt,
                temperature=completion_request.temperature,
                max_tokens=completion_request.max_tokens,
            )
        except ProviderTimeoutError as exc:
            self._log_request(
                provider=resolved_provider.record,
                model_name=resolved_provider.adapter.model_name,
                request_type="chat_completion",
                status="timeout",
                latency_ms=self._elapsed_ms(started_at),
            )
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=str(exc),
            ) from exc
        except ProviderError as exc:
            self._log_request(
                provider=resolved_provider.record,
                model_name=resolved_provider.adapter.model_name,
                request_type="chat_completion",
                status="error",
                latency_ms=self._elapsed_ms(started_at),
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=str(exc),
            ) from exc

        usage = result.get("usage") or {}
        self._log_request(
            provider=resolved_provider.record,
            model_name=resolved_provider.adapter.model_name,
            request_type="chat_completion",
            status="success",
            latency_ms=self._elapsed_ms(started_at),
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
            total_tokens=usage.get("total_tokens"),
        )

        return ChatCompletionResponse(
            generated_text=result.get("generated_text", ""),
            provider=resolved_provider.record.provider_type,
            model=resolved_provider.adapter.model_name,
            usage=TokenUsage(**usage),
        )

    def resolve_provider(
        self,
        *,
        provider_name: str | None,
        model_name: str | None,
    ) -> ResolvedProvider:
        provider_key = provider_name.strip().lower() if provider_name else None
        provider_record = self._find_provider_record(provider_key)
        if provider_record is None:
            provider_record = self._resolve_environment_provider(provider_key, model_name)

        adapter = self._build_adapter(provider_record, model_name)
        return ResolvedProvider(record=provider_record, adapter=adapter)

    def _find_provider_record(self, provider_key: str | None) -> AIProvider | None:
        statement = select(AIProvider).where(AIProvider.is_active.is_(True))
        if provider_key:
            statement = statement.where(
                (AIProvider.name == provider_key) | (AIProvider.provider_type == provider_key),
            )
        statement = statement.order_by(AIProvider.id)
        return self.db.scalars(statement).first()

    def _resolve_environment_provider(
        self,
        provider_key: str | None,
        model_name: str | None,
    ) -> AIProvider:
        if provider_key in (None, "openrouter") and settings.openrouter_api_key:
            return self._get_or_create_env_provider(
                name="openrouter",
                provider_type="openrouter",
                base_url="https://openrouter.ai/api/v1",
                model_name=model_name or settings.openrouter_default_model,
            )
        if provider_key in (None, "groq") and settings.groq_api_key:
            return self._get_or_create_env_provider(
                name="groq",
                provider_type="groq",
                base_url="https://api.groq.com/openai/v1",
                model_name=model_name or settings.groq_default_model,
            )
        if provider_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported or inactive provider: {provider_key}.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active AI provider is configured.",
        )

    def _get_or_create_env_provider(
        self,
        *,
        name: str,
        provider_type: str,
        base_url: str,
        model_name: str,
    ) -> AIProvider:
        statement = select(AIProvider).where(
            AIProvider.name == name,
            AIProvider.provider_type == provider_type,
        )
        provider = self.db.scalars(statement).first()
        if provider is not None:
            provider.base_url = base_url
            provider.model_name = model_name
            provider.is_active = True
            self.db.add(provider)
            self.db.commit()
            self.db.refresh(provider)
            return provider

        provider = AIProvider(
            name=name,
            provider_type=provider_type,
            base_url=base_url,
            model_name=model_name,
            is_active=True,
        )
        self.db.add(provider)
        self.db.commit()
        self.db.refresh(provider)
        return provider

    def _build_adapter(self, provider: AIProvider, model_name: str | None) -> BaseProvider:
        provider_type = provider.provider_type.lower()
        resolved_model = model_name or provider.model_name
        timeout_seconds = settings.ai_provider_timeout_seconds
        if provider_type == "openrouter":
            if not settings.openrouter_api_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OPENROUTER_API_KEY is not configured.",
                )
            return OpenRouterProvider(
                api_key=settings.openrouter_api_key,
                model_name=resolved_model,
                base_url=provider.base_url or "https://openrouter.ai/api/v1",
                timeout_seconds=timeout_seconds,
            )
        if provider_type == "groq":
            if not settings.groq_api_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="GROQ_API_KEY is not configured.",
                )
            return GroqProvider(
                api_key=settings.groq_api_key,
                model_name=resolved_model,
                base_url=provider.base_url or "https://api.groq.com/openai/v1",
                timeout_seconds=timeout_seconds,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider type: {provider.provider_type}.",
        )

    def _log_request(
        self,
        *,
        provider: AIProvider,
        model_name: str,
        request_type: str,
        status: str,
        latency_ms: int | None = None,
        prompt_tokens: int | None = None,
        completion_tokens: int | None = None,
        total_tokens: int | None = None,
    ) -> AIRequestLog:
        request_log = AIRequestLog(
            provider_id=provider.id,
            model_name=model_name,
            request_type=request_type,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            status=status,
            latency_ms=latency_ms,
        )
        self.db.add(request_log)
        self.db.commit()
        self.db.refresh(request_log)
        return request_log

    def _elapsed_ms(self, started_at: float) -> int:
        return int((perf_counter() - started_at) * 1000)
