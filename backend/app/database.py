from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.config import settings
from app.services.display_utils import display_text, nice_class_label, squash_whitespace


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _connect() -> sqlite3.Connection:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(settings.database_path, timeout=30)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    return connection


def init_database() -> None:
    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_tasks (
                task_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                current_step INTEGER NOT NULL,
                progress INTEGER NOT NULL,
                request_json TEXT NOT NULL,
                result_json TEXT,
                error_message TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_audit_tasks_created_at ON audit_tasks(created_at)"
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                company TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            )
            """
        )
        if (
            connection.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'").fetchone()[0]
            == 0
        ):
            connection.execute(
                """
                INSERT INTO users (
                    user_id, username, password_hash, role, company, created_at
                ) VALUES (?, 'admin', ?, 'admin', 'Outbound-Guard Team', ?)
                """,
                (secrets.token_hex(16), _hash_password("admin123"), _now()),
            )


def _hash_password(password: str, salt: str | None = None) -> str:
    actual_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), actual_salt.encode("utf-8"), 120_000
    ).hex()
    return f"{actual_salt}${digest}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, _ = stored_hash.split("$", 1)
    except ValueError:
        return False
    return secrets.compare_digest(_hash_password(password, salt), stored_hash)


def _public_user(row: sqlite3.Row | dict[str, Any]) -> dict[str, str]:
    return {
        "userId": row["user_id"],
        "username": row["username"],
        "role": row["role"],
        "company": row["company"],
        "createdAt": row["created_at"],
    }


def create_user(username: str, password: str, company: str = "", role: str = "user") -> dict[str, str]:
    user_id = secrets.token_hex(16)
    timestamp = _now()
    with _connect() as connection:
        if connection.execute("SELECT 1 FROM users WHERE username = ?", (username,)).fetchone():
            raise ValueError("用户名已存在")
        connection.execute(
            """
            INSERT INTO users (
                user_id, username, password_hash, role, company, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, username, _hash_password(password), role, company or "未填写", timestamp),
        )
        row = connection.execute(
            "SELECT * FROM users WHERE user_id = ?", (user_id,)
        ).fetchone()
    return _public_user(row)


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()
    if row is None or not _verify_password(password, row["password_hash"]):
        return None
    return dict(row)


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    with _connect() as connection:
        connection.execute(
            "INSERT INTO user_sessions (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, _now()),
        )
    return token


def get_user_by_token(token: str) -> dict[str, str] | None:
    with _connect() as connection:
        row = connection.execute(
            """
            SELECT users.* FROM user_sessions
            JOIN users ON users.user_id = user_sessions.user_id
            WHERE user_sessions.token = ?
            """,
            (token,),
        ).fetchone()
    return _public_user(row) if row else None


def delete_session(token: str) -> None:
    with _connect() as connection:
        connection.execute("DELETE FROM user_sessions WHERE token = ?", (token,))


def create_task(task_id: str, request_data: dict[str, Any]) -> None:
    timestamp = _now()
    normalized_request = dict(request_data)
    for field in ("brandName", "englishName", "goodsServices", "businessDescription"):
        if field in normalized_request:
            normalized_request[field] = squash_whitespace(normalized_request[field])
    if "niceClass" in normalized_request:
        normalized_request["niceClass"] = nice_class_label(normalized_request["niceClass"])
    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO audit_tasks (
                task_id, status, current_step, progress, request_json,
                result_json, error_message, created_at, updated_at
            ) VALUES (?, 'pending', 0, 0, ?, NULL, NULL, ?, ?)
            """,
            (task_id, json.dumps(normalized_request, ensure_ascii=False), timestamp, timestamp),
        )


def update_task(
    task_id: str,
    *,
    status: str | None = None,
    current_step: int | None = None,
    progress: int | None = None,
    result: dict[str, Any] | None = None,
    error_message: str | None = None,
) -> None:
    fields: list[str] = ["updated_at = ?"]
    values: list[Any] = [_now()]
    if status is not None:
        fields.append("status = ?")
        values.append(status)
    if current_step is not None:
        fields.append("current_step = ?")
        values.append(current_step)
    if progress is not None:
        fields.append("progress = ?")
        values.append(max(0, min(100, progress)))
    if result is not None:
        fields.append("result_json = ?")
        values.append(json.dumps(result, ensure_ascii=False))
    if error_message is not None:
        fields.append("error_message = ?")
        values.append(error_message)
    values.append(task_id)
    with _connect() as connection:
        connection.execute(
            f"UPDATE audit_tasks SET {', '.join(fields)} WHERE task_id = ?",
            values,
        )


def get_task(task_id: str) -> dict[str, Any] | None:
    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM audit_tasks WHERE task_id = ?", (task_id,)
        ).fetchone()
    if row is None:
        return None
    task = dict(row)
    task["request"] = json.loads(task.pop("request_json"))
    raw_result = task.pop("result_json")
    task["result"] = json.loads(raw_result) if raw_result else None
    return task


def get_statistics() -> dict[str, int]:
    with _connect() as connection:
        total = connection.execute(
            "SELECT COUNT(*) FROM audit_tasks WHERE status = 'done'"
        ).fetchone()[0]
        high_risk = connection.execute(
            """
            SELECT COUNT(*) FROM audit_tasks
            WHERE status = 'done' AND json_extract(result_json, '$.riskLevel') = 'high'
            """
        ).fetchone()[0]
    return {"auditedBrands": int(total), "highRiskBlocked": int(high_risk)}


def list_audit_tasks(limit: int = 50) -> list[dict[str, Any]]:
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT task_id, status, current_step, progress, request_json,
                   result_json, error_message, created_at, updated_at
            FROM audit_tasks
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (max(1, min(limit, 200)),),
        ).fetchall()
    tasks: list[dict[str, Any]] = []
    for row in rows:
        request = json.loads(row["request_json"])
        result = json.loads(row["result_json"]) if row["result_json"] else None
        brand_name = (result or {}).get("brandName") or request.get("brandName", "")
        nice_class = (result or {}).get("niceClass") or request.get("niceClass", "")
        summary = (result or {}).get("overallResult") or request.get("goodsServices", "")
        tasks.append(
            {
                "taskId": row["task_id"],
                "status": row["status"],
                "currentStep": row["current_step"],
                "progress": row["progress"],
                "brandName": display_text(brand_name, "品牌信息待补充"),
                "niceClass": nice_class_label(nice_class, "类别待补充"),
                "targetCountries": request.get("targetCountries", []),
                "riskLevel": result.get("riskLevel") if result else "",
                "riskScore": result.get("riskScore") if result else 0,
                "manualReviewRequired": bool(result.get("manualReviewRequired")) if result else False,
                "summary": display_text(summary, "审查摘要待生成"),
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "errorMessage": row["error_message"] or "",
            }
        )
    return tasks


def get_admin_statistics() -> dict[str, Any]:
    base = get_statistics()
    with _connect() as connection:
        total_tasks = connection.execute("SELECT COUNT(*) FROM audit_tasks").fetchone()[0]
        processing = connection.execute(
            "SELECT COUNT(*) FROM audit_tasks WHERE status IN ('pending', 'processing')"
        ).fetchone()[0]
        users = connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        medium_risk = connection.execute(
            """
            SELECT COUNT(*) FROM audit_tasks
            WHERE status = 'done' AND json_extract(result_json, '$.riskLevel') = 'medium'
            """
        ).fetchone()[0]
    return {
        **base,
        "totalTasks": int(total_tasks),
        "processingTasks": int(processing),
        "registeredUsers": int(users),
        "mediumRisk": int(medium_risk),
    }


def reset_database(path: Path | None = None) -> None:
    target = path or settings.database_path
    if target.exists():
        target.unlink()
