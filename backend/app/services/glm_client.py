from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.core.config import settings


class GLMConfigurationError(RuntimeError):
    pass


class GLMClient:
    """智谱 GLM 的 OpenAI-compatible chat completions client."""

    def _headers(self) -> dict[str, str]:
        if not settings.GLM_API_KEY or not settings.glm_base_url:
            raise GLMConfigurationError("GLM 模型尚未配置，请设置 GLM_API_KEY。")
        return {
            "Authorization": f"Bearer {settings.GLM_API_KEY}",
            "Content-Type": "application/json",
        }

    def _payload(self, messages: list[dict[str, Any]], stream: bool) -> dict[str, Any]:
        return {
            "model": settings.GLM_MODEL,
            "messages": messages,
            "stream": stream,
        }

    async def complete(self, messages: list[dict[str, Any]]) -> str:
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                f"{settings.glm_base_url}/chat/completions",
                headers=self._headers(),
                json=self._payload(messages, stream=False),
            )
        response.raise_for_status()
        choices = response.json().get("choices", [])
        content = choices[0].get("message", {}).get("content", "") if choices else ""
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("GLM 模型没有返回可用回答。")
        return content.strip()

    async def stream(self, messages: list[dict[str, Any]]) -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=90) as client:
            async with client.stream(
                "POST",
                f"{settings.glm_base_url}/chat/completions",
                headers={**self._headers(), "Accept": "text/event-stream"},
                json=self._payload(messages, stream=True),
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line.removeprefix("data:").strip()
                    if data == "[DONE]":
                        return
                    try:
                        payload = json.loads(data)
                        delta = payload.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    except (IndexError, TypeError, ValueError):
                        continue
                    if isinstance(delta, str) and delta:
                        yield delta
