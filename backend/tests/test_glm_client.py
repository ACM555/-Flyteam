import asyncio

from app.core.config import settings
from app.services.glm_client import GLMClient, GLMConfigurationError


def test_glm_client_requires_api_key(monkeypatch):
    monkeypatch.setattr(settings, "GLM_API_KEY", "")
    client = GLMClient()

    try:
        client._headers()
    except GLMConfigurationError as error:
        assert "GLM_API_KEY" in str(error)
    else:
        raise AssertionError("GLM client should reject an empty API key")


def test_glm_client_posts_openai_compatible_payload(monkeypatch):
    calls = []

    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {"choices": [{"message": {"content": "GLM response"}}]}

    class AsyncClient:
        def __init__(self, *, timeout):
            assert timeout == 90

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_value, traceback):
            return None

        async def post(self, url, *, headers, json):
            calls.append((url, headers, json))
            return Response()

    monkeypatch.setattr(settings, "GLM_API_KEY", "test-key")
    monkeypatch.setattr(settings, "GLM_BASE_URL", "https://glm.example/v4/")
    monkeypatch.setattr(settings, "GLM_MODEL", "glm-test")
    monkeypatch.setattr("app.services.glm_client.httpx.AsyncClient", AsyncClient)

    result = asyncio.run(GLMClient().complete([{"role": "user", "content": "hello"}]))

    assert result == "GLM response"
    assert calls == [
        (
            "https://glm.example/v4/chat/completions",
            {"Authorization": "Bearer test-key", "Content-Type": "application/json"},
            {
                "model": "glm-test",
                "messages": [{"role": "user", "content": "hello"}],
                "stream": False,
            },
        )
    ]
