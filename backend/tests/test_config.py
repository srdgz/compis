import pytest

from compis.config import normalise_database_url


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("postgres://u:p@h:5432/db", "postgresql+psycopg2://u:p@h:5432/db"),
        ("postgresql://u:p@h/db?sslmode=require", "postgresql+psycopg2://u:p@h/db?sslmode=require"),
        ("postgresql+psycopg2://u:p@h/db", "postgresql+psycopg2://u:p@h/db"),
        ("sqlite:///compis.db", "sqlite:///compis.db"),
        ("sqlite://", "sqlite://"),
    ],
)
def test_postgres_urls_always_use_the_psycopg2_driver(raw, expected):
    assert normalise_database_url(raw) == expected
