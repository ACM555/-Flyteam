from __future__ import annotations

import base64
import binascii
import re
from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response

from app.api.auth import current_user
from app.core.config import settings
from app.database import create_task, get_task, update_task
from app.models.audit import AuditRequest, AuditResponse, AuditResult, UnifiedResponse
from app.services.audit_engine import run_audit
from app.services.pdf_service import build_audit_pdf


router = APIRouter(prefix="/audit", tags=["商标审查"])


def _task_is_visible(task: dict, user: dict) -> bool:
    """Keep task ids opaque: a non-owner sees the same response as a missing task."""

    return user.get("role") == "superadmin" or task.get("user_id") == user.get("userId")


def _validate_logo(logo: str) -> None:
    payload = logo.split(",", 1)[1] if "," in logo and "base64" in logo[:80].lower() else logo
    compact = re.sub(r"\s+", "", payload)
    if not compact:
        raise HTTPException(status_code=422, detail="Logo 图片不能为空")
    try:
        decoded = base64.b64decode(compact, validate=True)
    except (ValueError, binascii.Error) as error:
        raise HTTPException(status_code=422, detail="Logo 不是有效的 Base64 图片") from error
    if not decoded:
        raise HTTPException(status_code=422, detail="Logo 图片不能为空")
    if len(decoded) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Logo 图片超过大小限制")


def _elapsed_seconds(created_at: str) -> float:
    try:
        created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        if created.tzinfo is None:
            created = created.replace(tzinfo=UTC)
        return max(0.0, (datetime.now(UTC) - created).total_seconds())
    except (TypeError, ValueError):
        return 0.0


@router.post(
    "",
    response_model=UnifiedResponse,
    status_code=202,
    summary="提交商标审查",
)
async def submit_audit(
    req: AuditRequest,
    user: dict = Depends(current_user),
) -> UnifiedResponse:
    """Create a durable, user-owned audit task."""

    _validate_logo(req.logo)
    task_id = str(uuid4())
    create_task(task_id, req.model_dump(), user["userId"])
    response = AuditResponse(
        taskId=task_id,
        status="pending",
        message="审查已提交，正在处理中",
    )
    return UnifiedResponse(code=0, message="审查已提交", data=response.model_dump())


@router.get(
    "/result/{taskId}",
    response_model=UnifiedResponse,
    summary="获取审查结果",
)
async def get_audit_result(taskId: str, user: dict = Depends(current_user)) -> UnifiedResponse:
    """Poll a task; its state survives an API process restart."""

    task = get_task(taskId)
    if not task or not _task_is_visible(task, user):
        raise HTTPException(status_code=404, detail="任务不存在")

    if task["status"] not in {"done", "error"}:
        elapsed = _elapsed_seconds(task["created_at"])
        if elapsed < 1:
            update_task(taskId, status="pending", current_step=0, progress=10)
        elif elapsed < 2:
            update_task(taskId, status="processing", current_step=0, progress=33)
        elif elapsed < 3:
            update_task(taskId, status="processing", current_step=1, progress=66)
        elif elapsed < 4:
            update_task(taskId, status="processing", current_step=2, progress=90)
        else:
            try:
                update_task(taskId, status="processing", current_step=2, progress=95)
                result = run_audit(task["request"])
                advice = result.setdefault("advice", {})
                advice["documentDownloadUrl"] = f"/api/audit/report/{taskId}/pdf"
                update_task(
                    taskId,
                    status="done",
                    current_step=2,
                    progress=100,
                    result=result,
                    error_message="",
                )
            except Exception as error:
                update_task(
                    taskId,
                    status="error",
                    progress=100,
                    error_message=str(error)[:500],
                )
        task = get_task(taskId) or task

    result = {
        "taskId": taskId,
        "status": task["status"],
        "currentStep": min(task["current_step"], 2),
        "progress": task["progress"],
    }
    if task["status"] == "done" and task["result"]:
        result.update(task["result"])
    if task["status"] == "error":
        result["errorMessage"] = task["error_message"] or "审查任务处理失败"

    AuditResult.model_validate(result)
    return UnifiedResponse(code=0, message="success", data=result)


@router.get("/report/{taskId}/pdf", response_class=Response, summary="下载审查 PDF 报告")
async def download_audit_pdf(taskId: str, user: dict = Depends(current_user)) -> Response:
    """Generate a PDF only for a completed task visible to the current user."""

    task = get_task(taskId)
    if not task or not _task_is_visible(task, user):
        raise HTTPException(status_code=404, detail="任务不存在")
    if task["status"] != "done" or not task.get("result"):
        raise HTTPException(status_code=409, detail="审查尚未完成，暂时无法下载报告")

    content = build_audit_pdf({**task["result"], "taskId": taskId})
    filename = f"outbound-guard-{taskId[:8]}.pdf"
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
