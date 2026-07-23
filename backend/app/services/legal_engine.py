from __future__ import annotations

import json
import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from app.config import settings


HAN_PATTERN = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")
LATIN_PATTERN = re.compile(r"[A-Za-zÀ-ỹ]")


@dataclass(frozen=True)
class LegalAssessment:
    hit_rules: list[dict[str, Any]]
    references: list[dict[str, Any]]
    absolute_risk: bool
    rejection_probability: int


@lru_cache(maxsize=1)
def load_rules() -> list[dict[str, Any]]:
    return json.loads(settings.legal_rules_path.read_text(encoding="utf-8"))


def _is_han_only(value: str) -> bool:
    meaningful = "".join(character for character in value if character.isalnum())
    return bool(meaningful and HAN_PATTERN.search(meaningful) and not LATIN_PATTERN.search(meaningful))


def assess_absolute_rules(brand_name: str, english_name: str) -> LegalAssessment:
    rules = load_rules()
    han_only = _is_han_only(brand_name) and not LATIN_PATTERN.search(english_name or "")
    hit_rules: list[dict[str, Any]] = []
    references: list[dict[str, Any]] = []

    for rule in rules:
        applicable = rule["ruleId"] == "VN-IP-74-2-A" and han_only
        note = rule["triggerNote"] if applicable else rule["safeNote"]
        hit_rules.append(
            {
                "ruleType": rule["ruleType"],
                "article": rule["article"],
                "content": rule["summary"],
                "applicable": applicable,
                "similarityType": "",
                "similarityScore": 88 if applicable else 0,
                "note": note,
            }
        )
        references.append(
            {
                "refType": "law",
                "title": rule["article"],
                "source": rule["sourceName"],
                "date": rule["effectiveDate"],
                "registrationNo": "",
                "summary": rule["summary"],
                "relevance": note,
                "sourceUrl": rule["sourceUrl"],
            }
        )

    return LegalAssessment(
        hit_rules=hit_rules,
        references=references,
        absolute_risk=han_only,
        rejection_probability=88 if han_only else 8,
    )
