import ast
from pathlib import Path

PACKAGE = Path(__file__).resolve().parent.parent / "compis"

FORBIDDEN = {
    "domain": {
        "flask",
        "sqlalchemy",
        "pydantic",
        "flask_jwt_extended",
        "compis.application",
        "compis.infrastructure",
        "compis.interfaces",
    },
    "application": {
        "flask",
        "sqlalchemy",
        "pydantic",
        "flask_jwt_extended",
        "compis.infrastructure",
        "compis.interfaces",
    },
}


def imported_modules(path: Path) -> set[str]:
    modules = set()
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            modules.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.add(node.module)
    return modules


def violations(layer: str) -> list[str]:
    found = []
    for path in (PACKAGE / layer).rglob("*.py"):
        for module in imported_modules(path):
            if any(module == bad or module.startswith(bad + ".") for bad in FORBIDDEN[layer]):
                found.append(f"{path.relative_to(PACKAGE)} imports {module}")
    return found


def test_domain_depends_on_nothing_outside_itself():
    assert violations("domain") == []


def test_application_does_not_depend_on_frameworks_or_outer_layers():
    assert violations("application") == []
