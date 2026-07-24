from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings
from app.models.assistant import AssistantSource
from app.services.assistant_knowledge import KnowledgeDocument, SYSTEM_GUIDES


@dataclass(frozen=True)
class RetrievedKnowledge:
    source: AssistantSource
    content: str


def _tokens(value: str) -> set[str]:
    latin = re.findall(r"[a-z0-9_]{2,}", value.lower())
    chinese = re.findall(r"[\u4e00-\u9fff]{2,}", value)
    return set(latin + chinese)


def _excerpt(value: str) -> str:
    compact = re.sub(r"\s+", " ", value).strip()
    return compact[:240] + ("…" if len(compact) > 240 else "")


class RetrievalService:
    """Tenant-scoped lexical retrieval with a seam for future embeddings."""

    def retrieve(self, question: str, user_id: str, limit: int = 5) -> list[RetrievedKnowledge]:
        documents = [*SYSTEM_GUIDES, *self._tenant_documents(user_id)]
        query_tokens = _tokens(question)
        ranked: list[tuple[int, KnowledgeDocument]] = []
        for document in documents:
            score = len(query_tokens & _tokens(f"{document.title} {document.content}"))
            if score:
                ranked.append((score, document))
        ranked.sort(key=lambda item: item[0], reverse=True)
        selected = ranked[:limit] or [(0, SYSTEM_GUIDES[0])]
        return [
            RetrievedKnowledge(
                source=AssistantSource(
                    id=document.id,
                    title=document.title,
                    excerpt=_excerpt(document.content),
                ),
                content=document.content,
            )
            for _, document in selected
        ]

    def store_text_document(self, user_id: str, filename: str, content: str) -> str:
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", filename) or "document.txt"
        directory = Path(settings.ASSISTANT_KNOWLEDGE_DIR) / user_id
        directory.mkdir(parents=True, exist_ok=True)
        (directory / safe_name).write_text(content, encoding="utf-8")
        return f"tenant-{user_id}-{safe_name}"

    def _tenant_documents(self, user_id: str) -> list[KnowledgeDocument]:
        directory = Path(settings.ASSISTANT_KNOWLEDGE_DIR) / user_id
        if not directory.exists():
            return []
        documents: list[KnowledgeDocument] = []
        for path in directory.glob("*.txt"):
            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if content.strip():
                documents.append(
                    KnowledgeDocument(
                        id=f"tenant-{user_id}-{path.name}",
                        title=f"用户资料：{path.name}",
                        content=content[:20_000],
                    )
                )
        return documents
