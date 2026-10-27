def new_task(session, roomie_id, name="Sacar la basura", day="03-11-2026"):
    return session.post(
        "/api/task", json={"roomie_id": roomie_id, "name": name, "date_assigned": day}
    )


def test_task_lifecycle(flat, clock):
    owner, marcos, home_id = flat["owner"], flat["marcos"], flat["home_id"]
    created = new_task(owner, marcos.id)
    assert created.status_code == 201
    task_id = created.get_json()["id"]
    assert created.get_json()["date_assigned"] == "2026-11-03"
    assert created.get_json()["date_done"] is None

    pending = owner.get(f"/api/task/home/{home_id}?only_pending_tasks=true").get_json()
    assert [t["roomie"]["first_name"] for t in pending] == ["Marcos"]

    assert marcos.put(f"/api/task/{task_id}").get_json()["message"] == "Tarea completada"
    done = owner.get(f"/api/task/roomie/{marcos.id}").get_json()[0]
    assert done["date_done"] == "2026-11-02"
    assert owner.get(f"/api/task/home/{home_id}?only_pending_tasks=true").get_json() == []

    again = marcos.put(f"/api/task/{task_id}").get_json()["message"]
    assert again == "La tarea ya está marcada como completada"

    moved = owner.put(f"/api/task/date/{task_id}", json={"new_date_assigned": "2026-12-01"})
    assert moved.get_json()["date_assigned"] == "2026-12-01"
    assert owner.delete(f"/api/task/{task_id}").status_code == 200
    assert owner.get(f"/api/task/roomie/{marcos.id}").get_json() == []


def test_task_validation_and_permissions(flat, register):
    outsider = register("Nuria")
    owner, marcos = flat["owner"], flat["marcos"]
    assert new_task(owner, marcos.id, day="31/02/2026").status_code == 400
    assert new_task(owner, marcos.id, name="  ").status_code == 400
    assert new_task(outsider, marcos.id).status_code == 403
    task_id = new_task(owner, marcos.id).get_json()["id"]
    assert outsider.put(f"/api/task/{task_id}").status_code == 403
    assert outsider.delete(f"/api/task/{task_id}").status_code == 403
    assert owner.put("/api/task/999").status_code == 404


def test_shopping_list_flow(flat):
    owner, marcos, list_id = flat["owner"], flat["marcos"], flat["list_id"]
    assert owner.get(f"/api/list/home/{flat['home_id']}").get_json()["id"] == list_id
    item = marcos.post("/api/item", json={"name": "Leche", "shopping_list_id": list_id})
    assert item.status_code == 201
    items = owner.get(f"/api/item/list/{list_id}").get_json()
    assert [i["name"] for i in items] == ["Leche"]
    assert owner.delete(f"/api/item/{item.get_json()['id']}").status_code == 200
    assert owner.get(f"/api/item/list/{list_id}").get_json() == []


def test_outsider_cannot_touch_the_shopping_list(flat, register):
    outsider = register("Nuria")
    list_id = flat["list_id"]
    assert (
        outsider.post("/api/item", json={"name": "x", "shopping_list_id": list_id}).status_code
        == 403
    )
    assert outsider.get(f"/api/item/list/{list_id}").status_code == 403


def test_files_require_https_and_membership(flat, register):
    outsider = register("Nuria")
    home_id = flat["home_id"]
    body = {"name": "Contrato", "url": "https://res.cloudinary.com/x.pdf", "home_id": home_id}
    assert outsider.post("/api/file", json=body).status_code == 403
    assert (
        flat["owner"].post("/api/file", json={**body, "url": "http://insecure"}).status_code == 400
    )
    created = flat["marcos"].post("/api/file", json=body)
    assert created.status_code == 201
    listed = flat["owner"].get(f"/api/file/home/{home_id}").get_json()
    assert [f["name"] for f in listed] == ["Contrato"]
    assert outsider.delete(f"/api/file/{created.get_json()['id']}").status_code == 403
    assert flat["owner"].delete(f"/api/file/{created.get_json()['id']}").status_code == 200


def test_activity_feed_records_changes(flat):
    new_task(flat["owner"], flat["marcos"].id)
    feed = flat["aitana"].get(f"/api/blog/home/{flat['home_id']}").get_json()
    texts = [entry["text"] for entry in feed]
    assert "Nueva tarea asignada: Sacar la basura" in texts
    assert "Nuevo roomie agregado: Aitana" in texts


def test_calendar_shows_own_tasks_and_debts_only(flat):
    owner, marcos = flat["owner"], flat["marcos"]
    new_task(owner, marcos.id)
    events = marcos.get(f"/api/calendar/{marcos.id}").get_json()
    assert [(e["type"], e["start"]) for e in events] == [("task", "2026-11-03")]
    assert owner.get(f"/api/calendar/{marcos.id}").status_code == 403
