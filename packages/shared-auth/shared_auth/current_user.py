from dataclasses import dataclass, field


@dataclass(frozen=True)
class CurrentUserContext:
    user_id: int | str
    email: str | None = None
    organization_id: int | None = None
    workspace_id: int | None = None
    roles: list[str] = field(default_factory=list)
    permissions: list[str] = field(default_factory=list)
