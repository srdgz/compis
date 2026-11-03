import json
from typing import Any

import requests

from compis.application.assistant.types import (
    ChatMessage,
    ModelError,
    ModelReply,
    ToolCall,
    ToolSpec,
)

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = "gemini-3.5-flash-lite"
TIMEOUT_SECONDS = 6
MAX_OUTPUT_TOKENS = 600
TEMPERATURE = 0.2


class GeminiLanguageModel:
    def __init__(self, api_key: str, model: str = DEFAULT_MODEL, http: Any = requests) -> None:
        self._api_key = api_key
        self._model = model
        self._http = http

    def complete(
        self, system: str, messages: list[ChatMessage], tools: list[ToolSpec]
    ) -> ModelReply:
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": self._contents(messages),
            "tools": [{"functionDeclarations": [self._declaration(tool) for tool in tools]}],
            "toolConfig": {"functionCallingConfig": {"mode": "AUTO"}},
            "generationConfig": {
                "temperature": TEMPERATURE,
                "maxOutputTokens": MAX_OUTPUT_TOKENS,
            },
        }
        try:
            response = self._http.post(
                f"{BASE_URL}/{self._model}:generateContent",
                json=body,
                headers={"x-goog-api-key": self._api_key, "Content-Type": "application/json"},
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as error:
            raise ModelError("could not reach the model") from error
        if response.status_code != 200:
            raise ModelError(f"model returned status {response.status_code}")
        return self._parse(response)

    def _declaration(self, tool: ToolSpec) -> dict[str, Any]:
        declaration: dict[str, Any] = {"name": tool.name, "description": tool.description}
        if tool.parameters.get("properties"):
            declaration["parameters"] = tool.parameters
        return declaration

    def _contents(self, messages: list[ChatMessage]) -> list[dict[str, Any]]:
        contents: list[dict[str, Any]] = []
        for message in messages:
            if message.role == "tool":
                part = {
                    "functionResponse": {
                        "name": message.tool_name,
                        "response": {"result": json.loads(message.content)},
                    }
                }
                last = contents[-1] if contents else None
                if (
                    last is not None
                    and last["role"] == "user"
                    and "functionResponse" in last["parts"][0]
                ):
                    last["parts"].append(part)
                else:
                    contents.append({"role": "user", "parts": [part]})
            elif message.role == "assistant" and message.provider_data is not None:
                contents.append(message.provider_data)
            elif message.role == "assistant" and message.tool_calls:
                parts = [
                    {"functionCall": {"name": call.name, "args": call.arguments}}
                    for call in message.tool_calls
                ]
                contents.append({"role": "model", "parts": parts})
            else:
                role = "model" if message.role == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": message.content}]})
        return contents

    def _parse(self, response: Any) -> ModelReply:
        try:
            candidate = response.json()["candidates"][0]
            content = candidate["content"]
            parts = content.get("parts", [])
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise ModelError("the model reply has no content") from error
        text = "".join(
            part["text"]
            for part in parts
            if isinstance(part.get("text"), str) and not part.get("thought")
        )
        calls = tuple(
            ToolCall(part["functionCall"]["name"], dict(part["functionCall"].get("args") or {}))
            for part in parts
            if isinstance(part.get("functionCall"), dict) and "name" in part["functionCall"]
        )
        if calls:
            return ModelReply(text, calls, provider_data=content)
        return ModelReply(text)
