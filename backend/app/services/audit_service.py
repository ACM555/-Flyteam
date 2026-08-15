"""Compatibility entry point for callers that used the former task worker."""

from __future__ import annotations

from pathlib import Path

from app.database import get_task, update_task
from app.services.audit_engine import run_audit


def process_audit_task(task_id: str, image_path: Path | None = None) -> None:
    """Process a persisted task using the current deterministic audit engine.

    The HTTP API currently performs lazy processing on the first poll. This
    wrapper keeps the old worker import usable for a future queue consumer.
    """

    try:
        task = get_task(task_id)
        if task is None:
            raise RuntimeError("审查任务不存在")
        update_task(task_id, status="processing", current_step=0, progress=15)
        result = run_audit(task["request"])
        result.setdefault("advice", {})["documentDownloadUrl"] = f"/api/audit/report/{task_id}/pdf"
        update_task(
            task_id,
            status="done",
            current_step=2,
            progress=100,
            result=result,
            error_message="",
        )
    except Exception as error:
        update_task(task_id, status="error", progress=100, error_message=str(error)[:500])
    finally:
        if image_path is not None:
            image_path.unlink(missing_ok=True)
