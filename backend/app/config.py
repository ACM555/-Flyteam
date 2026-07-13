from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]


def _split_origins(value: str) -> tuple[str, ...]:
    return tuple(origin.strip() for origin in value.split(",") if origin.strip())


@dataclass(frozen=True)
class Settings:
    host: str = os.getenv("APP_HOST", "127.0.0.1")
    port: int = int(os.getenv("APP_PORT", "8000"))
    frontend_origins: tuple[str, ...] = _split_origins(
        os.getenv(
            "FRONTEND_ORIGINS",
            "http://127.0.0.1:5173,http://localhost:5173",
        )
    )
    vision_api_url: str = os.getenv("VISION_API_URL", "").strip()
    vision_api_key: str = os.getenv("VISION_API_KEY", "").strip()
    vision_model: str = os.getenv("VISION_MODEL", "").strip()
    vision_timeout_seconds: float = float(os.getenv("VISION_TIMEOUT_SECONDS", "30"))
    ip_vietnam_base_url: str = os.getenv(
        "IP_VIETNAM_BASE_URL",
        "https://wipopublish.ipvietnam.gov.vn/wopublish-search",
    ).rstrip("/")
    database_path: Path = Path(
        os.getenv(
            "DATABASE_PATH",
            str(BACKEND_DIR / "data" / "runtime" / "outbound_guard.sqlite3"),
        )
    )
    upload_dir: Path = Path(
        os.getenv("UPLOAD_DIR", str(BACKEND_DIR / "data" / "runtime" / "uploads"))
    )
    trademark_image_dir: Path = BACKEND_DIR / "data" / "trademark_images"
    legal_rules_path: Path = BACKEND_DIR / "data" / "legal_rules.json"
    trademark_db_path: Path = BACKEND_DIR / "data" / "trademark_db.json"
    case_db_path: Path = BACKEND_DIR / "data" / "case_db.json"


settings = Settings()
