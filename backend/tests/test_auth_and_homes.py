def signup(client, email="ana@example.com", password="password-123", **extra):
    return client.post(
        "/api/signup",
        json={"email": email, "password": password, "first_name": "Ana", **extra},
    )


def test_signup_and_login(client):
    assert signup(client).status_code == 201
    response = client.post(
        "/api/login", json={"email": "ANA@example.com", "password": "password-123"}
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["token"]
    assert data["home_id"] is None


def test_signup_rejects_duplicates_and_weak_passwords(client):
    assert signup(client).status_code == 201
    assert signup(client).status_code == 409
    assert signup(client, email="b@example.com", password="short").status_code == 400
    assert signup(client, email="not-an-email").status_code == 400


def test_login_fails_with_wrong_password(client):
    signup(client)
    response = client.post("/api/login", json={"email": "ana@example.com", "password": "nope-nope"})
    assert response.status_code == 401


def test_endpoints_require_a_token(client):
    assert client.get("/api/roomie/1").status_code == 401
    assert client.get("/api/home/1").status_code == 401
    assert client.get("/api/task/home/1").status_code == 401


def test_invalid_json_body_is_a_400(client):
    response = client.post("/api/login", data="not json", content_type="application/json")
    assert response.status_code == 400


def test_creating_a_home_makes_the_creator_admin(register):
    owner = register("Lucia")
    response = owner.post("/api/home", json={"name": "Mi piso"})
    assert response.status_code == 201
    home_id = response.get_json()["home_id"]
    assert owner.get(f"/api/roomie/{owner.id}").get_json()["admin"] is True
    assert owner.get(f"/api/home/{home_id}").get_json()["name"] == "Mi piso"
    assert owner.post("/api/home", json={"name": "Otro"}).status_code == 409


def test_only_admin_can_add_roomies(flat, register):
    outsider = register("Nuria")
    home_id = flat["home_id"]
    denied = flat["marcos"].post(f"/api/home/{home_id}", json={"email": "nuria@example.com"})
    assert denied.status_code == 403
    allowed = flat["owner"].post(f"/api/home/{home_id}", json={"email": "nuria@example.com"})
    assert allowed.status_code == 200
    assert outsider.get(f"/api/roomie/home/{home_id}").status_code == 200


def test_roomie_with_a_home_cannot_join_another(flat, register):
    other_owner = register("Pablo")
    other_home = other_owner.post("/api/home", json={"name": "Otro piso"}).get_json()["home_id"]
    response = other_owner.post(f"/api/home/{other_home}", json={"email": "marcos@example.com"})
    assert response.status_code == 409


def test_outsiders_cannot_read_a_home(flat, register):
    outsider = register("Nuria")
    home_id = flat["home_id"]
    assert outsider.get(f"/api/home/{home_id}").status_code == 403
    assert outsider.get(f"/api/roomie/home/{home_id}").status_code == 403
    assert outsider.get(f"/api/roomie/{flat['owner'].id}").status_code == 403
    assert outsider.get(f"/api/task/home/{home_id}").status_code == 403
    assert outsider.get(f"/api/file/home/{home_id}").status_code == 403
    assert outsider.get(f"/api/blog/home/{home_id}").status_code == 403


def test_roomies_can_only_edit_their_own_profile(flat):
    owner, marcos = flat["owner"], flat["marcos"]
    assert marcos.put(f"/api/roomie/{owner.id}", json={"first_name": "X"}).status_code == 403
    response = marcos.put(
        f"/api/roomie/{marcos.id}", json={"first_name": "Marc", "paypal_username": "marc"}
    )
    assert response.get_json()["first_name"] == "Marc"
    assert response.get_json()["paypal_username"] == "marc"
    assert marcos.put(f"/api/roomie/{marcos.id}", json={"email": "x@y.com"}).status_code == 400


def test_admin_can_remove_a_roomie_without_pending_debts(flat):
    home_id = flat["home_id"]
    removed = flat["owner"].delete(f"/api/home/{home_id}/{flat['aitana'].id}")
    assert removed.status_code == 200
    assert flat["aitana"].get(f"/api/home/{home_id}").status_code == 403


def test_deactivating_a_home_frees_its_roomies(flat):
    home_id = flat["home_id"]
    assert flat["marcos"].put(f"/api/home/{home_id}").status_code == 403
    assert flat["owner"].put(f"/api/home/{home_id}").status_code == 200
    assert flat["owner"].get(f"/api/roomie/{flat['marcos'].id}").status_code == 403
    me = flat["marcos"].get(f"/api/roomie/{flat['marcos'].id}").get_json()
    assert me["home_id"] is None


def test_account_deletion_requires_leaving_the_home(flat, register):
    assert flat["marcos"].put(f"/api/roomie/delete/{flat['marcos'].id}").status_code == 403
    loner = register("Nuria")
    assert loner.put(f"/api/roomie/delete/{loner.id}").status_code == 200
    response = loner.client.post(
        "/api/login", json={"email": "nuria@example.com", "password": "password-123"}
    )
    assert response.status_code == 401


def test_a_roomie_can_set_and_remove_a_profile_picture(flat):
    marcos = flat["marcos"]
    url = "https://res.cloudinary.com/demo/image/upload/v1/marcos.jpg"
    updated = marcos.put(f"/api/roomie/{marcos.id}", json={"avatar": url})
    assert updated.get_json()["avatar"] == url
    teammate = flat["owner"].get(f"/api/roomie/{marcos.id}").get_json()
    assert teammate["avatar"] == url

    bad = marcos.put(f"/api/roomie/{marcos.id}", json={"avatar": "javascript:alert(1)"})
    assert bad.status_code == 400
    insecure = marcos.put(f"/api/roomie/{marcos.id}", json={"avatar": "http://example.com/a.png"})
    assert insecure.status_code == 400

    removed = marcos.put(f"/api/roomie/{marcos.id}", json={"avatar": None})
    assert removed.get_json()["avatar"] is None
