from __future__ import annotations

from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import (
    authenticate_user,
    create_session,
    create_task,
    create_user,
    delete_session,
    get_admin_statistics,
    get_statistics,
    get_task,
    get_user_by_token,
    init_database,
    list_audit_tasks,
)
from app.models import AuditRequest, LoginRequest, RegisterRequest
from app.services.audit_service import process_audit_task
from app.services.display_utils import display_text, nice_class_label
from app.services.pdf_service import build_audit_pdf
from app.services.platform_service import (
    build_report_center,
    get_brand_assets,
    get_country_rules,
    get_data_source_status,
    get_monitoring_alerts,
    get_platform_overview,
)
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


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="请先登录")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="登录凭证无效")
    return token


def current_user(authorization: str | None = Header(default=None)) -> dict:
    token = _extract_token(authorization)
    user = get_user_by_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="登录已失效，请重新登录")
    return user


def admin_user(user: dict = Depends(current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


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


@app.post("/api/auth/register")
def register(payload: RegisterRequest) -> dict:
    role = "admin" if payload.inviteCode == "ADMIN2026" else "user"
    try:
        user = create_user(payload.username, payload.password, payload.company, role)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    token = create_session(user["userId"])
    return success({"token": token, "user": user}, "注册成功")


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> dict:
    row = authenticate_user(payload.username, payload.password)
    if row is None:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    token = create_session(row["user_id"])
    user = {
        "userId": row["user_id"],
        "username": row["username"],
        "role": row["role"],
        "company": row["company"],
        "createdAt": row["created_at"],
    }
    return success({"token": token, "user": user}, "登录成功")


@app.get("/api/auth/me")
def me(user: dict = Depends(current_user)) -> dict:
    return success(user)


@app.post("/api/auth/logout")
def logout(authorization: str | None = Header(default=None)) -> dict:
    delete_session(_extract_token(authorization))
    return success(None, "已退出登录")


@app.get("/api/admin/statistics")
def admin_statistics(_: dict = Depends(admin_user)) -> dict:
    return success(get_admin_statistics())


@app.get("/api/admin/tasks")
def admin_tasks(_: dict = Depends(admin_user)) -> dict:
    return success(list_audit_tasks())


@app.get("/api/admin/tasks/{task_id}")
def admin_task_detail(task_id: str, _: dict = Depends(admin_user)) -> dict:
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="审查任务不存在")
    return success(task)


@app.get("/api/platform/overview")
def platform_overview() -> dict:
    return success(get_platform_overview())


@app.get("/api/rules/countries")
def country_rules() -> dict:
    return success(get_country_rules())


@app.get("/api/brands")
def brand_assets(_: dict = Depends(current_user)) -> dict:
    return success(get_brand_assets())


@app.get("/api/reports")
def report_center(_: dict = Depends(current_user)) -> dict:
    return success(build_report_center(list_audit_tasks()))


@app.get("/api/monitoring/alerts")
def monitoring_alerts(_: dict = Depends(current_user)) -> dict:
    return success(get_monitoring_alerts())


@app.get("/api/data-sources/status")
def data_source_status(_: dict = Depends(current_user)) -> dict:
    return success(get_data_source_status())


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
            "brandName": display_text(request["brandName"], "品牌信息待补充"),
            "niceClass": nice_class_label(request["niceClass"], "类别待补充"),
            "goodsServices": display_text(request["goodsServices"], "商品或服务描述待补充"),
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
