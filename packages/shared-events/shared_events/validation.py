from shared_events.naming import is_valid_dot_notation, validate_event_name


def is_valid_event_name(event_name: str) -> bool:
    return is_valid_dot_notation(event_name)
