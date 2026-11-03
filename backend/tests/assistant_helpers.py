from compis.application.assistant.types import ChatMessage, ModelReply, ToolSpec


class ScriptedModel:
    def __init__(self, *replies: ModelReply | Exception) -> None:
        self._replies = list(replies)
        self.calls: list[tuple[str, list[ChatMessage], list[ToolSpec]]] = []

    def complete(
        self, system: str, messages: list[ChatMessage], tools: list[ToolSpec]
    ) -> ModelReply:
        self.calls.append((system, list(messages), list(tools)))
        reply = self._replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        return reply


def ask(session, text, locale="es", **extra):
    body = {"messages": [{"role": "user", "content": text}], "locale": locale, **extra}
    return session.post("/api/assistant/messages", json=body)


def seed_flat(flat):
    owner, marcos, aitana = flat["owner"], flat["marcos"], flat["aitana"]
    ids = [
        owner.post("/api/item", json={"name": n, "shopping_list_id": flat["list_id"]}).get_json()[
            "id"
        ]
        for n in ("Leche", "Pan", "Fruta")
    ]
    expense = owner.post("/api/expense", json={"expense_name": "Compra", "item_ids": ids})
    owner.post(
        "/api/debts",
        json={
            "expense_id": expense.get_json()["expense"]["id"],
            "debtor_ids": [marcos.id, aitana.id],
            "total_amount": 45.90,
        },
    )
    for name in ("Yogur", "Arroz"):
        owner.post("/api/item", json={"name": name, "shopping_list_id": flat["list_id"]})
    for name, day in (("Sacar el reciclaje", "2026-10-30"), ("Fregar", "2026-11-10")):
        owner.post("/api/task", json={"roomie_id": marcos.id, "name": name, "date_assigned": day})
