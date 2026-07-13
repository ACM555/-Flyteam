from __future__ import annotations

from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import create_task, get_statistics, get_task, init_database
from app.models import AuditRequest
from app.services.audit_service import process_audit_task
from app.services.pdf_service import build_audit_pdf
from app.services.vision_service import decode_logo, save_temporary_image, validate_and_normalize_image


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.trademark_image_dir.mkdir(parents=True, exist_ok=True)
    init_database()
    yield


app = FastAPI(
    title="Outbound-Guard API",
    version="1.0.0",
    description="越南出海商标合规智能体后端",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
app.mount(
    "/api/assets/trademarks",
    StaticFiles(directory=settings.trademark_image_dir, check_dir=False),
    name="trademark-assets",
)


def success(data: object | None = None, message: str = "success") -> dict:
    return {"code": 0, "message": message, "data": data}


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, error: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={"code": error.status_code, "message": str(error.detail), "data": None},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, error: RequestValidationError) -> JSONResponse:
    first_error = error.errors()[0] if error.errors() else {}
    message = str(first_error.get("msg", "请求参数校验失败"))
    return JSONResponse(
        status_code=422,
        content={"code": 422, "message": message, "data": None},
    )


@app.get("/api/health")
def health() -> dict:
    return success(
        {
            "status": "ok",
            "visionMode": "remote-assisted" if settings.vision_api_url else "local-opencv",
        }
    )


@app.get("/api/statistics")
def statistics() -> dict:
    return success(get_statistics())


@app.post("/api/audit", status_code=202)
def create_audit(payload: AuditRequest, background_tasks: BackgroundTasks) -> dict:
    task_id = str(uuid4())
    try:
        image_bytes = validate_and_normalize_image(decode_logo(payload.logo))
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    image_path = save_temporary_image(task_id, image_bytes)
    request_data = payload.model_dump(exclude={"logo"})
    try:
        create_task(task_id, request_data)
    except Exception:
        image_path.unlink(missing_ok=True)
        raise
    background_tasks.add_task(process_audit_task, task_id, image_path)
    return success({"taskId": task_id}, "审查任务已创建")


@app.get("/api/audit/result/{task_id}")
def audit_result(task_id: str) -> dict:
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="审查任务不存在")
    if task["result"]:
        return success(task["result"])
    request = task["request"]
    return success(
        {
            "taskId": task_id,
            "status": task["status"],
            "currentStep": task["current_step"],
            "progress": task["progress"],
            "errorMessage": task["error_message"],
            "brandName": request["brandName"],
            "niceClass": request["niceClass"],
            "goodsServices": request["goodsServices"],
        }
    )


@app.get("/api/audit/report/{task_id}/pdf")
def audit_pdf(task_id: str) -> StreamingResponse:
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="审查任务不存在")
    if task["status"] != "done" or not task["result"]:
        raise HTTPException(status_code=409, detail="审查尚未完成")
    content = build_audit_pdf(task["result"])
    safe_name = quote(f"{task['result'].get('brandName', 'brand')}-越南商标合规报告.pdf")
    return StreamingResponse(
        BytesIO(content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_name}"},
    )
