from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.config import settings


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


def create_task(task_id: str, request_data: dict[str, Any]) -> None:
    timestamp = _now()
    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO audit_tasks (
                task_id, status, current_step, progress, request_json,
                result_json, error_message, created_at, updated_at
            ) VALUES (?, 'pending', 0, 0, ?, NULL, NULL, ?, ?)
            """,
            (task_id, json.dumps(request_data, ensure_ascii=False), timestamp, timestamp),
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


def reset_database(path: Path | None = None) -> None:
    target = path or settings.database_path
    if target.exists():
        target.unlink()
