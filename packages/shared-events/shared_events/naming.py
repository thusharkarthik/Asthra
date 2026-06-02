import re

EVENT_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$")


def is_valid_dot_notation(event_name: str) -> bool:
    return bool(EVENT_NAME_PATTERN.match(event_name))


def validate_event_name(event_name: str) -> str:
    if not is_valid_dot_notation(event_name):
        raise ValueError("Event names must use dot notation like core.organization.created.")
    return event_name
