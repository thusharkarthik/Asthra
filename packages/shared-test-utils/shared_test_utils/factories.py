from uuid import uuid4


def sample_id(value: int = 1) -> int:
    return value


def sample_uuid() -> str:
    return str(uuid4())


def sample_email(prefix: str = "user") -> str:
    return f"{prefix}@example.com"
