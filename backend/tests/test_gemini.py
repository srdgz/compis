import pytest
import requests

from compis.application.assistant.tools import SPECS
from compis.application.assistant.types import ChatMessage, ModelError, ToolCall
from compis.bootstrap import create_app
from compis.config import Settings
from compis.infrastructure.gemini import BASE_URL, DEFAULT_MODEL, GeminiLanguageModel


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        if self._payload is None:
            raise ValueError("no json")
        return self._payload


class FakeHttp:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error
        self.requests = []

    def post(self, url, json=None, headers=None, timeout=None):
        self.requests.append({"url": url, "json": json, "headers": headers, "timeout": timeout})
        if self.error:
            raise self.error
        return self.response


def reply(*parts):
    return FakeResponse(200, {"candidates": [{"content": {"role": "model", "parts": list(parts)}}]})


def model_with(response=None, error=None):
    http = FakeHttp(response, error)
    return GeminiLanguageModel("secret-key", "test-model", http), http


def test_request_has_the_expected_shape():
    model, http = model_with(reply({"text": "Hola"}))
    result = model.complete("system text", [ChatMessage("user", "¿Qué debo?")], list(SPECS))
    assert result.text == "Hola" and result.tool_calls == ()
    sent = http.requests[0]
    assert sent["url"] == f"{BASE_URL}/test-model:generateContent"
    assert sent["headers"]["x-goog-api-key"] == "secret-key"
    assert "secret-key" not in sent["url"]
    assert sent["timeout"] == 6
    body = sent["json"]
    assert body["systemInstruction"] == {"parts": [{"text": "system text"}]}
    assert body["contents"] == [{"role": "user", "parts": [{"text": "¿Qué debo?"}]}]
    declarations = body["tools"][0]["functionDeclarations"]
    assert [d["name"] for d in declarations] == [spec.name for spec in SPECS]
    by_name = {d["name"]: d for d in declarations}
    assert "parameters" not in by_name["get_debts"]
    assert by_name["get_tasks"]["parameters"]["properties"]["only_pending"]["type"] == "boolean"
    assert body["toolConfig"] == {"functionCallingConfig": {"mode": "AUTO"}}


def test_function_calls_are_parsed_and_the_raw_turn_is_kept():
    parts = [{"functionCall": {"name": "get_tasks", "args": {"only_pending": True}}}]
    model, _ = model_with(reply(*parts))
    result = model.complete("s", [ChatMessage("user", "tareas")], list(SPECS))
    assert result.tool_calls == (ToolCall("get_tasks", {"only_pending": True}),)
    assert result.provider_data == {"role": "model", "parts": parts}


def test_thought_parts_are_not_shown_as_the_answer():
    model, _ = model_with(reply({"text": "thinking", "thought": True}, {"text": "Respuesta"}))
    assert model.complete("s", [ChatMessage("user", "x")], []).text == "Respuesta"


def test_tool_turns_are_sent_back_in_the_provider_format():
    raw = {
        "role": "model",
        "parts": [{"functionCall": {"name": "get_today", "args": {}}, "thoughtSignature": "sig"}],
    }
    messages = [
        ChatMessage("user", "¿Qué día es?"),
        ChatMessage("assistant", "", (ToolCall("get_today"),), provider_data=raw),
        ChatMessage("tool", '{"today": "2026-11-02"}', tool_name="get_today"),
        ChatMessage("tool", '{"items": []}', tool_name="get_shopping_list"),
    ]
    model, http = model_with(reply({"text": "Lunes"}))
    model.complete("s", messages, list(SPECS))
    contents = http.requests[0]["json"]["contents"]
    assert contents[1] == raw
    assert contents[2] == {
        "role": "user",
        "parts": [
            {
                "functionResponse": {
                    "name": "get_today",
                    "response": {"result": {"today": "2026-11-02"}},
                }
            },
            {
                "functionResponse": {
                    "name": "get_shopping_list",
                    "response": {"result": {"items": []}},
                }
            },
        ],
    }


def test_tool_turns_without_raw_data_are_rebuilt():
    messages = [
        ChatMessage("user", "x"),
        ChatMessage("assistant", "", (ToolCall("get_tasks", {"only_pending": False}),)),
        ChatMessage("assistant", "previous answer"),
    ]
    model, http = model_with(reply({"text": "ok"}))
    model.complete("s", messages, [])
    contents = http.requests[0]["json"]["contents"]
    assert contents[1] == {
        "role": "model",
        "parts": [{"functionCall": {"name": "get_tasks", "args": {"only_pending": False}}}],
    }
    assert contents[2] == {"role": "model", "parts": [{"text": "previous answer"}]}


@pytest.mark.parametrize(
    "kwargs",
    [
        {"error": requests.Timeout("slow")},
        {"error": requests.ConnectionError("down")},
        {"response": FakeResponse(429, {"error": "quota"})},
        {"response": FakeResponse(500)},
        {"response": FakeResponse(200, {"candidates": []})},
        {"response": FakeResponse(200, {"promptFeedback": {"blockReason": "SAFETY"}})},
        {"response": FakeResponse(200)},
    ],
)
def test_provider_problems_raise_a_model_error(kwargs):
    model, _ = model_with(**kwargs)
    with pytest.raises(ModelError):
        model.complete("s", [ChatMessage("user", "x")], [])


def test_the_provider_is_only_enabled_with_a_key():
    base = {"testing": True}
    off = create_app(Settings(**base))
    assert off.extensions["compis"].assistant._model is None
    no_key = create_app(Settings(assistant_provider="gemini", **base))
    assert no_key.extensions["compis"].assistant._model is None
    other = create_app(Settings(assistant_provider="other", gemini_api_key="k", **base))
    assert other.extensions["compis"].assistant._model is None
    on = create_app(Settings(assistant_provider="gemini", gemini_api_key="k", **base))
    model = on.extensions["compis"].assistant._model
    assert isinstance(model, GeminiLanguageModel)
    assert model._model == DEFAULT_MODEL
    custom = create_app(
        Settings(assistant_provider="gemini", gemini_api_key="k", assistant_model="m-1", **base)
    )
    assert custom.extensions["compis"].assistant._model._model == "m-1"
