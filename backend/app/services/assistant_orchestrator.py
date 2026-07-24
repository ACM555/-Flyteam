from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from app.models.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.bailian_client import BailianClient
from app.services.rag_retrieval_service import RetrievalService


class AssistantOrchestrator:
    def __init__(self) -> None:
        self._retrieval = RetrievalService()
        self._model = BailianClient()

    def _messages(self, request: AssistantChatRequest, user_id: str) -> tuple[list[dict[str, Any]], list[str], list]:
        retrieved = self._retrieval.retrieve(request.question, user_id)
        context = "\n\n".join(f"[{item.source.id}] {item.source.title}\n{item.content}" for item in retrieved)
        system = (
            "你是 Outbound Guard 的合规工作流助手，服务于中国企业进入越南市场前的商标材料准备。"
            "仅基于提供的资料回答；资料不足时明确说明。不得声称已经获得注册或给出替代律师意见的结论。"
            "回答使用中文，简洁说明下一步。引用资料时使用 [资料ID]。"
            f"\n\n当前页面：{request.page or '未指定'}\n\n可用资料：\n{context}"
        )
        user_content: list[dict[str, Any]] = [{"type": "text", "text": request.question}]
        if request.image_data_url:
            user_content.append({"type": "image_url", "image_url": {"url": request.image_data_url}})
        return [{"role": "system", "content": system}, {"role": "user", "content": user_content}], self._actions_for_page(request.page), retrieved

    async def answer(self, request: AssistantChatRequest, user_id: str) -> AssistantChatResponse:
        messages, actions, retrieved = self._messages(request, user_id)
        return AssistantChatResponse(
            answer=await self._model.complete(messages),
            sources=[item.source for item in retrieved],
            suggested_actions=actions,
        )

    async def stream(self, request: AssistantChatRequest, user_id: str) -> AsyncIterator[str]:
        messages, _, _ = self._messages(request, user_id)
        async for delta in self._model.stream(messages):
            yield delta

    def store_text_document(self, user_id: str, filename: str, content: str) -> str:
        return self._retrieval.store_text_document(user_id, filename, content)

    @staticmethod
    def _actions_for_page(page: str) -> list[str]:
        mappings = {
            "/assets": ["补充品牌资产", "前往智能审查"],
            "/submit": ["检查提交材料", "查看规则库"],
            "/reviewing": ["查看审查进度", "查看报告中心"],
            "/reports": ["查看审查报告", "前往规则库"],
        }
        return mappings.get(page, ["新建智能审查", "查看品牌资产", "浏览规则库"])
