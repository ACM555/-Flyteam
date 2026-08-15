from __future__ import annotations

from pydantic import BaseModel, Field


class AssistantSource(BaseModel):
    id: str
    title: str
    excerpt: str


class AssistantChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    page: str = Field(default="", max_length=120)
    image_data_url: str | None = Field(default=None, max_length=14_000_000)


class AssistantChatResponse(BaseModel):
    answer: str
    sources: list[AssistantSource]
    suggested_actions: list[str]


class AssistantUploadResponse(BaseModel):
    document_id: str
    filename: str
    indexed: bool
    message: str
