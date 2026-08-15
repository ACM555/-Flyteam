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

    GLM_API_KEY: str = os.getenv("GLM_API_KEY", "")
    GLM_BASE_URL: str = os.getenv("GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
    GLM_MODEL: str = os.getenv("GLM_MODEL", "glm-4-flash")
    ASSISTANT_KNOWLEDGE_DIR: str = os.getenv("ASSISTANT_KNOWLEDGE_DIR", "data/assistant_knowledge")
    ASSISTANT_MAX_FILE_MB: int = _get_int("ASSISTANT_MAX_FILE_MB", 10)

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    REPORT_DIR: str = os.getenv("REPORT_DIR", "reports")
    DATA_DIR: str = os.getenv("DATA_DIR", "data")
    RULES_DIR: str = os.getenv("RULES_DIR", "rules")
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "data/outbound_guard.sqlite3")
    SUPERADMIN_USERNAME: str = os.getenv("SUPERADMIN_USERNAME", "superadmin")
    SUPERADMIN_PASSWORD: str = os.getenv("SUPERADMIN_PASSWORD", "")
    DEMO_MODE: bool = _get_bool("DEMO_MODE", False)
    DEMO_USERNAME: str = os.getenv("DEMO_USERNAME", "demo")
    DEMO_PASSWORD: str = os.getenv("DEMO_PASSWORD", "")
    DEMO_COMPANY: str = os.getenv("DEMO_COMPANY", "GoAI 竞赛演示账号")

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
        if self.is_production and self.DEBUG:
            errors.append("生产环境必须设置 DEBUG=false")
        if self.is_production and self.SUPERADMIN_PASSWORD.startswith("replace-with-"):
            errors.append("生产环境不能使用示例超级管理员密码")
        if self.DEMO_MODE and not self.DEMO_PASSWORD:
            errors.append("DEMO_MODE=true 时必须配置 DEMO_PASSWORD")
        if self.DEMO_MODE and self.DEMO_USERNAME == self.SUPERADMIN_USERNAME:
            errors.append("DEMO_USERNAME 不能与 SUPERADMIN_USERNAME 相同")
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

        if self.is_production and (
            not self.GLM_API_KEY or self.GLM_API_KEY.startswith("replace-with-")
        ):
            errors.append("生产环境必须配置 GLM_API_KEY")

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
            self.resolve_path(directory).mkdir(parents=True, exist_ok=True)

    @property
    def database_path(self) -> Path:
        return self.resolve_path(self.DATABASE_PATH)

    @staticmethod
    def resolve_path(value: str | Path) -> Path:
        path = Path(value)
        if path.is_absolute():
            return path
        return Path(__file__).resolve().parents[2] / path

    @property
    def glm_base_url(self) -> str:
        return self.GLM_BASE_URL.rstrip("/")


settings = Settings()
