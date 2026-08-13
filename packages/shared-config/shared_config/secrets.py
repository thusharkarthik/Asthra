def mask_secret(value: str | None) -> str | None:
    if value is None:
        return None
    if value == "":
        return ""
    if len(value) <= 4:
        return "*" * len(value)
    return f"{value[:2]}{'*' * (len(value) - 4)}{value[-2:]}"
