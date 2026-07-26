import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    try:
        return int(value)
    except ValueError as exc:
        raise RuntimeError(f"{name} 必须是整数") from exc


def _get_list(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    """应用配置（从环境变量读取）。"""

    APP_NAME: str = os.getenv("APP_NAME", "Outbound-Guard API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = _get_bool("DEBUG", True)
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = _get_int("PORT", 8000)

    CORS_ORIGINS: list[str] = _get_list(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )

    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    BAILIAN_API_KEY: str = os.getenv("BAILIAN_API_KEY", "")
    BAILIAN_WORKSPACE_ID: str = os.getenv("BAILIAN_WORKSPACE_ID", "")
    BAILIAN_BASE_URL: str = os.getenv("BAILIAN_BASE_URL", "")
    BAILIAN_MODEL: str = os.getenv("BAILIAN_MODEL", "kimi-k2.7-code")
    ASSISTANT_KNOWLEDGE_DIR: str = os.getenv("ASSISTANT_KNOWLEDGE_DIR", "data/assistant_knowledge")
    ASSISTANT_MAX_FILE_MB: int = _get_int("ASSISTANT_MAX_FILE_MB", 10)

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    REPORT_DIR: str = os.getenv("REPORT_DIR", "reports")
    DATA_DIR: str = os.getenv("DATA_DIR", "data")
    RULES_DIR: str = os.getenv("RULES_DIR", "rules")
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "data/outbound_guard.sqlite3")
    SUPERADMIN_USERNAME: str = os.getenv("SUPERADMIN_USERNAME", "superadmin")
    SUPERADMIN_PASSWORD: str = os.getenv("SUPERADMIN_PASSWORD", "")

    AUDIT_TIMEOUT_SECONDS: int = _get_int("AUDIT_TIMEOUT_SECONDS", 60)
    MAX_IMAGE_SIZE_MB: int = _get_int("MAX_IMAGE_SIZE_MB", 5)

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.strip().lower() == "production"

    def validate(self) -> None:
        """启动时校验配置；模拟阶段不强制要求模型 API Key。"""

        errors: list[str] = []
        if not self.APP_NAME:
            errors.append("APP_NAME 未设置")
        if not self.APP_VERSION:
            errors.append("APP_VERSION 未设置")
        if not self.CORS_ORIGINS:
            errors.append("CORS_ORIGINS 至少需要配置一个来源")
        if self.PORT <= 0 or self.PORT > 65535:
            errors.append("PORT 必须在 1-65535 之间")
        if self.AUDIT_TIMEOUT_SECONDS <= 0:
            errors.append("AUDIT_TIMEOUT_SECONDS 必须大于 0")
        if self.MAX_IMAGE_SIZE_MB <= 0:
            errors.append("MAX_IMAGE_SIZE_MB 必须大于 0")
        if not self.SUPERADMIN_PASSWORD:
            errors.append("必须通过 SUPERADMIN_PASSWORD 配置超级管理员密码")
        if self.ASSISTANT_MAX_FILE_MB <= 0:
            errors.append("ASSISTANT_MAX_FILE_MB 必须大于 0")

        required_dirs = {
            "UPLOAD_DIR": self.UPLOAD_DIR,
            "REPORT_DIR": self.REPORT_DIR,
            "DATA_DIR": self.DATA_DIR,
            "RULES_DIR": self.RULES_DIR,
        }
        for name, value in required_dirs.items():
            if not value:
                errors.append(f"{name} 未设置")

        if self.is_production:
            placeholder_values = {"", "your-api-key-here", "your-gemini-api-key-here"}
            if self.LLM_API_KEY in placeholder_values and self.GEMINI_API_KEY in placeholder_values:
                errors.append("生产环境至少需要配置 LLM_API_KEY 或 GEMINI_API_KEY")

        if errors:
            raise RuntimeError("配置校验失败:\n" + "\n".join(f"  - {error}" for error in errors))

    def ensure_dirs(self) -> None:
        """确保存储目录存在。"""

        for directory in [
            self.UPLOAD_DIR,
            self.REPORT_DIR,
            self.DATA_DIR,
            self.RULES_DIR,
            self.ASSISTANT_KNOWLEDGE_DIR,
        ]:
            Path(directory).mkdir(parents=True, exist_ok=True)

    @property
    def database_path(self) -> Path:
        return Path(self.DATABASE_PATH)

    @property
    def bailian_base_url(self) -> str:
        if self.BAILIAN_BASE_URL:
            return self.BAILIAN_BASE_URL.rstrip("/")
        if self.BAILIAN_WORKSPACE_ID:
            return (
                "https://"
                f"{self.BAILIAN_WORKSPACE_ID}.cn-beijing.maas.aliyuncs.com"
                "/compatible-mode/v1"
            )
        return ""


settings = Settings()
