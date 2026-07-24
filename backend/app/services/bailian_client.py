from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.core.config import settings


class BailianConfigurationError(RuntimeError):
    pass


class BailianClient:
    def _headers(self) -> dict[str, str]:
        if not settings.BAILIAN_API_KEY or not settings.bailian_base_url:
            raise BailianConfigurationError("百炼模型尚未配置，请联系管理员。")
        return {"Authorization": f"Bearer {settings.BAILIAN_API_KEY}", "Content-Type": "application/json"}

    def _payload(self, messages: list[dict[str, Any]], stream: bool) -> dict[str, Any]:
        return {"model": settings.BAILIAN_MODEL, "messages": messages, "stream": stream}

    async def complete(self, messages: list[dict[str, Any]]) -> str:
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                f"{settings.bailian_base_url}/chat/completions",
                headers=self._headers(),
                json=self._payload(messages, stream=False),
            )
        response.raise_for_status()
        choices = response.json().get("choices", [])
        content = choices[0].get("message", {}).get("content", "") if choices else ""
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("模型没有返回可用回答。")
        return content.strip()

    async def stream(self, messages: list[dict[str, Any]]) -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=90) as client:
            async with client.stream(
                "POST",
                f"{settings.bailian_base_url}/chat/completions",
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
