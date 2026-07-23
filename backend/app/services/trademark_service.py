from __future__ import annotations

import json
import re
import unicodedata
from functools import lru_cache
from typing import Any

from rapidfuzz import fuzz

from app.config import settings


def _normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    without_marks = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"[^A-Z0-9]+", " ", without_marks.upper()).strip()


def _class_numbers(value: str) -> set[int]:
    return {int(number) for number in re.findall(r"\d+", value) if 1 <= int(number) <= 45}


@lru_cache(maxsize=1)
def load_trademarks() -> list[dict[str, Any]]:
    payload = json.loads(settings.trademark_db_path.read_text(encoding="utf-8"))
    return payload.get("records", [])


def reload_trademarks() -> None:
    load_trademarks.cache_clear()


def find_text_conflicts(
    brand_name: str,
    english_name: str,
    nice_class: str,
    *,
    limit: int = 5,
) -> list[dict[str, Any]]:
    query_values = [_normalize(brand_name), _normalize(english_name)]
    query_values = [value for value in query_values if value]
    requested_classes = _class_numbers(nice_class)
    candidates: list[tuple[float, dict[str, Any]]] = []

    for record in load_trademarks():
        record_values = [_normalize(record.get("markName", "")), _normalize(record.get("owner", ""))]
        score = max(
            (fuzz.WRatio(query, candidate) for query in query_values for candidate in record_values if candidate),
            default=0,
        )
        record_classes = set(record.get("classes", []))
        class_overlap = bool(requested_classes & record_classes)
        well_known = bool(record.get("wellKnown"))
        threshold = 72 if class_overlap else 88
        if well_known:
            threshold -= 8
        if score >= threshold:
            candidates.append((score, record))

    candidates.sort(key=lambda item: item[0], reverse=True)
    return [
        {
            "brandName": record.get("markName") or record.get("owner", "未知品牌"),
            "registeredClass": ", ".join(str(value) for value in record.get("classes", [])),
            "registrationNo": record.get("registrationNo") or record.get("applicationNo", ""),
            "similarityType": "文字近似" if score < 90 else "文字高度近似",
            "similarityScore": round(score),
            "owner": record.get("owner", ""),
            "status": record.get("status", ""),
            "sourceUrl": record.get("sourceUrl", ""),
            "thumbnailUrl": record.get("thumbnailUrl", ""),
            "wellKnown": bool(record.get("wellKnown")),
        }
        for score, record in candidates[:limit]
    ]


def get_visual_benchmark_conflict(score: int) -> dict[str, Any] | None:
    if score < 68:
        return None
    records = [record for record in load_trademarks() if record.get("visualBenchmark")]
    if not records:
        return None
    record = records[0]
    return {
        "brandName": record.get("markName") or record.get("owner", "视觉基准"),
        "registeredClass": ", ".join(str(value) for value in record.get("classes", [])),
        "registrationNo": record.get("registrationNo") or record.get("applicationNo", ""),
        "similarityType": "图形相似-四瓣对称几何结构",
        "similarityScore": score,
        "owner": record.get("owner", ""),
        "status": record.get("status", ""),
        "sourceUrl": record.get("sourceUrl", ""),
        "thumbnailUrl": record.get("thumbnailUrl") or "/lv-placeholder.svg",
        "wellKnown": bool(record.get("wellKnown")),
    }
