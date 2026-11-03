from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ToolCall:
    name: str
    arguments: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ChatMessage:
    role: str
    content: str = ""
    tool_calls: tuple[ToolCall, ...] = ()
    tool_name: str = ""
    provider_data: Any = None


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    parameters: dict[str, Any]


@dataclass(frozen=True)
class ModelReply:
    text: str = ""
    tool_calls: tuple[ToolCall, ...] = ()
    provider_data: Any = None


@dataclass(frozen=True)
class AssistantReply:
    reply: str
    source: str
    remaining_today: int | None


class ModelError(Exception):
    pass
