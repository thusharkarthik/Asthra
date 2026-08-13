import re
import unicodedata


def normalize_text(value: str | None) -> str:
    if value is None:
        return ""
    return " ".join(value.strip().split())


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.lower()).strip("-")
    return re.sub(r"-+", "-", slug)
