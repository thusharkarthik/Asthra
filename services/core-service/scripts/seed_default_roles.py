from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.repositories.role_repository import RoleRepository


DEFAULT_ROLES = [
    ("owner", "Full ownership role for a scope."),
    ("admin", "Administrative role for a scope."),
    ("manager", "Management role for a scope."),
    ("member", "Standard member role for a scope."),
    ("viewer", "Read-oriented viewer role for a scope."),
]


def main() -> None:
    db = SessionLocal()
    try:
        repository = RoleRepository(db)
        for name, description in DEFAULT_ROLES:
            if repository.get_by_scope_and_name("global", name) is None:
                repository.create(
                    name=name,
                    key=name,
                    description=description,
                    scope="global",
                    organization_id=None,
                )
    finally:
        db.close()


if __name__ == "__main__":
    main()
