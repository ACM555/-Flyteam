from __future__ import annotations

from datetime import datetime


def squash_whitespace(value: object) -> str:
    return " ".join(str(value or "").split())


def has_textual_content(value: str) -> bool:
    return any(character.isalpha() or "\u4e00" <= character <= "\u9fff" for character in value)


def display_text(value: object, fallback: str) -> str:
    text = squash_whitespace(value)
    if not text:
        return fallback
    stripped = "".join(character for character in text if not character.isspace())
    if not stripped or not has_textual_content(stripped):
        return fallback
    return text


def nice_class_label(value: object, fallback: str = "类别待补充") -> str:
    raw = squash_whitespace(value)
    if not raw:
        return fallback

    digits = "".join(character for character in raw if character.isdigit())
    cleaned = display_text(raw, "")
    if cleaned:
        if digits and "类" not in cleaned:
            return f"第{digits}类 {cleaned}".strip()
        return cleaned
    if digits:
        return f"第{digits}类"
    return fallback


def format_timestamp(value: object, fallback: str = "UNRECORDED") -> str:
    text = squash_whitespace(value)
    if not text:
        return fallback
    candidate = text.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        return text
    return parsed.strftime("%Y-%m-%d %H:%M")
