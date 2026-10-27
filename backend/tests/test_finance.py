def purchase(flat, names=("Leche", "Pan", "Fruta")):
    owner = flat["owner"]
    ids = [
        owner.post("/api/item", json={"name": n, "shopping_list_id": flat["list_id"]}).get_json()[
            "id"
        ]
        for n in names
    ]
    response = owner.post("/api/expense", json={"expense_name": "Compra", "item_ids": ids})
    return response, ids


def test_expense_marks_items_as_purchased(flat):
    response, ids = purchase(flat)
    assert response.status_code == 201
    owner = flat["owner"]
    assert owner.get(f"/api/item/list/{flat['list_id']}").get_json() == []
    bought = owner.get(f"/api/item/list/{flat['list_id']}?have_expense=true").get_json()
    assert sorted(i["id"] for i in bought) == sorted(ids)
    open_expenses = owner.get(f"/api/expense/roomie/{owner.id}").get_json()
    assert [e["name"] for e in open_expenses] == ["Compra"]


def test_purchased_items_cannot_be_bought_or_deleted_again(flat):
    _, ids = purchase(flat)
    owner = flat["owner"]
    again = owner.post("/api/expense", json={"expense_name": "Otra", "item_ids": ids[:1]})
    assert again.status_code == 409
    assert owner.delete(f"/api/item/{ids[0]}").status_code == 409
    assert owner.post("/api/expense", json={"expense_name": "x", "item_ids": []}).status_code == 400
    assert (
        owner.post("/api/expense", json={"expense_name": "x", "item_ids": [999]}).status_code == 404
    )


def test_debts_split_equally_including_the_payer(flat):
    owner, marcos, aitana = flat["owner"], flat["marcos"], flat["aitana"]
    expense_id = purchase(flat)[0].get_json()["expense"]["id"]
    response = owner.post(
        "/api/debts",
        json={
            "expense_id": expense_id,
            "debtor_ids": [marcos.id, aitana.id],
            "total_amount": 45.90,
        },
    )
    assert response.status_code == 201
    debts = response.get_json()["debts"]
    assert [d["amount"] for d in debts] == [15.3, 15.3]
    assert {d["status"] for d in debts} == {"Pendiente"}
    assert owner.get(f"/api/expense/roomie/{owner.id}").get_json() == []
    assert [d["amount"] for d in marcos.get(f"/api/debts/roomie/{marcos.id}").get_json()] == [15.3]
    assert len(owner.get(f"/api/debts/roomie/{owner.id}").get_json()) == 2


def test_debt_creation_rules(flat, register):
    owner, marcos = flat["owner"], flat["marcos"]
    outsider = register("Nuria")
    expense_id = purchase(flat)[0].get_json()["expense"]["id"]

    def create(session, **overrides):
        body = {
            "expense_id": expense_id,
            "debtor_ids": [marcos.id],
            "total_amount": 10,
            **overrides,
        }
        return session.post("/api/debts", json=body)

    assert create(marcos).status_code == 403
    assert create(owner, debtor_ids=[owner.id]).status_code == 400
    assert create(owner, debtor_ids=[outsider.id]).status_code == 400
    assert create(owner, total_amount=0).status_code == 400
    assert create(owner, total_amount=-5).status_code == 400
    assert create(owner).status_code == 201
    assert create(owner).status_code == 409


def make_debt(flat):
    owner, marcos = flat["owner"], flat["marcos"]
    expense_id = purchase(flat)[0].get_json()["expense"]["id"]
    owner.post(
        "/api/debts", json={"expense_id": expense_id, "debtor_ids": [marcos.id], "total_amount": 10}
    )
    return marcos.get(f"/api/debts/roomie/{marcos.id}").get_json()[0]["id"]


def test_debtor_reports_and_creditor_confirms(flat):
    owner, marcos, aitana = flat["owner"], flat["marcos"], flat["aitana"]
    debt_id = make_debt(flat)

    assert aitana.post(f"/api/debts/{debt_id}/report", json={"method": "cash"}).status_code == 403
    assert owner.post(f"/api/debts/{debt_id}/report", json={"method": "cash"}).status_code == 403
    assert marcos.post(f"/api/debts/{debt_id}/report", json={"method": "bizum"}).status_code == 400
    reported = marcos.post(f"/api/debts/{debt_id}/report", json={"method": "paypal_me"})
    assert reported.get_json()["message"] == "Pago comunicado"
    again = marcos.post(f"/api/debts/{debt_id}/report", json={"method": "paypal_me"})
    assert again.get_json()["message"] == "El pago ya estaba comunicado"

    debt = marcos.get(f"/api/debts/roomie/{marcos.id}").get_json()[0]
    assert (debt["status"], debt["payment_method"]) == ("Pagada", "paypal_me")

    assert marcos.post(f"/api/debts/{debt_id}/confirm").status_code == 403
    assert owner.post(f"/api/debts/{debt_id}/confirm").get_json()["message"] == "Pago confirmado"
    assert owner.post(f"/api/debts/{debt_id}/confirm").get_json()["message"] == (
        "La deuda ya estaba saldada"
    )
    assert marcos.get(f"/api/debts/roomie/{marcos.id}").get_json() == []
    settled = marcos.get(f"/api/debts/roomie/{marcos.id}?include_settled=true").get_json()
    assert [d["status"] for d in settled] == ["Confirmada"]
    assert marcos.post(f"/api/debts/{debt_id}/report", json={"method": "cash"}).status_code == 409

    feed = owner.get(f"/api/blog/home/{flat['home_id']}").get_json()
    texts = [entry["text"] for entry in feed]
    assert "Marcos dice que ha pagado 5,00€ a Lucia" in texts
    assert "Lucia ha confirmado el pago de 5,00€ de Marcos" in texts


def test_creditor_can_confirm_without_a_report_and_reject_a_report(flat):
    owner, marcos = flat["owner"], flat["marcos"]
    debt_id = make_debt(flat)
    assert owner.post(f"/api/debts/{debt_id}/reject").status_code == 409

    marcos.post(f"/api/debts/{debt_id}/report", json={"method": "cash"})
    assert marcos.post(f"/api/debts/{debt_id}/reject").status_code == 403
    assert owner.post(f"/api/debts/{debt_id}/reject").status_code == 200
    debt = marcos.get(f"/api/debts/roomie/{marcos.id}").get_json()[0]
    assert (debt["status"], debt["payment_method"]) == ("Pendiente", None)

    assert owner.post(f"/api/debts/{debt_id}/confirm").status_code == 200
    assert owner.post("/api/debts/999/confirm").status_code == 404


def test_a_reported_debt_still_blocks_removal_until_confirmed(flat):
    owner, marcos = flat["owner"], flat["marcos"]
    debt_id = make_debt(flat)
    marcos.post(f"/api/debts/{debt_id}/report", json={"method": "cash"})
    assert owner.delete(f"/api/home/{flat['home_id']}/{marcos.id}").status_code == 409
    owner.post(f"/api/debts/{debt_id}/confirm")
    assert owner.delete(f"/api/home/{flat['home_id']}/{marcos.id}").status_code == 200


def test_roomie_with_pending_debts_cannot_be_removed(flat):
    owner, marcos = flat["owner"], flat["marcos"]
    expense_id = purchase(flat)[0].get_json()["expense"]["id"]
    owner.post(
        "/api/debts", json={"expense_id": expense_id, "debtor_ids": [marcos.id], "total_amount": 10}
    )
    response = owner.delete(f"/api/home/{flat['home_id']}/{marcos.id}")
    assert response.status_code == 409
