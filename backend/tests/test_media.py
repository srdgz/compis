import pytest

from compis.bootstrap import create_app
from compis.config import Settings
from compis.domain.avatar import media_prefix, normalise_avatar_url
from compis.domain.errors import ValidationError
from compis.infrastructure.db.extensions import db

OWN = "https://res.cloudinary.com/mycloud/image/upload/v1/me.jpg"
OTHER = "https://res.cloudinary.com/someone-else/image/upload/v1/me.jpg"


def test_prefix_is_built_from_the_cloud_name():
    assert media_prefix("mycloud") == "https://res.cloudinary.com/mycloud/"
    assert media_prefix("  ") is None


def test_avatar_must_live_in_the_allowed_cloud():
    prefix = media_prefix("mycloud")
    assert normalise_avatar_url(OWN, prefix) == OWN
    with pytest.raises(ValidationError):
        normalise_avatar_url(OTHER, prefix)
    with pytest.raises(ValidationError):
        normalise_avatar_url("https://evil.example.com/a.png", prefix)


@pytest.fixture
def restricted_client(clock, mailer):
    app = create_app(
        Settings(testing=True, cloudinary_cloud_name="mycloud"), clock=clock, mailer=mailer
    )
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def sign_up(client, name):
    email = f"{name}@example.com"
    body = {"email": email, "password": "password-123", "first_name": name}
    client.post("/api/signup", json=body)
    data = client.post("/api/login", json={"email": email, "password": "password-123"}).get_json()
    return data["roomie_id"], {"Authorization": f"Bearer {data['token']}"}


def test_profile_pictures_are_limited_to_the_configured_cloud(restricted_client):
    roomie_id, headers = sign_up(restricted_client, "Ana")
    ok = restricted_client.put(f"/api/roomie/{roomie_id}", json={"avatar": OWN}, headers=headers)
    assert ok.status_code == 200
    bad = restricted_client.put(f"/api/roomie/{roomie_id}", json={"avatar": OTHER}, headers=headers)
    assert bad.status_code == 400


def test_files_are_limited_to_the_configured_cloud(restricted_client):
    roomie_id, headers = sign_up(restricted_client, "Ana")
    home_id = restricted_client.post(
        "/api/home", json={"name": "Piso"}, headers=headers
    ).get_json()["home_id"]
    good = {"name": "Contrato", "url": OWN, "home_id": home_id}
    assert restricted_client.post("/api/file", json=good, headers=headers).status_code == 201
    outside = {**good, "url": "https://example.com/contrato.pdf"}
    assert restricted_client.post("/api/file", json=outside, headers=headers).status_code == 400
