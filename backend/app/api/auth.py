from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.database import (
    authenticate_user,
    create_session,
    create_user,
    delete_session,
    get_user_by_token,
)


router = APIRouter(prefix="/auth", tags=["认证"])


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=32)
    password: str = Field(min_length=6, max_length=64)
    company: str = Field(default="", max_length=80)
    inviteCode: str = Field(default="", max_length=32)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=32)
    password: str = Field(min_length=1, max_length=64)


def _success(data: object | None = None, message: str = "success") -> dict:
    return {"code": 0, "message": message, "data": data}


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="请先登录")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="登录凭证无效")
    return token


def current_user(authorization: str | None = Header(default=None)) -> dict:
    user = get_user_by_token(_extract_token(authorization))
    if user is None:
        raise HTTPException(status_code=401, detail="登录已失效，请重新登录")
    return user


def admin_user(user: dict = Depends(current_user)) -> dict:
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


def _auth_result(row: dict) -> dict:
    token = create_session(row["user_id"])
    user = {
        "userId": row["user_id"],
        "username": row["username"],
        "role": row["role"],
        "company": row["company"],
        "createdAt": row["created_at"],
    }
    return {"token": token, "user": user}


@router.post("/register")
def register(payload: RegisterRequest) -> dict:
    try:
        user = create_user(payload.username, payload.password, payload.company, "user")
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    token = create_session(user["userId"])
    return _success({"token": token, "user": user}, "注册成功")


@router.post("/login")
def login(payload: LoginRequest) -> dict:
    row = authenticate_user(payload.username, payload.password)
    if row is None:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    return _success(_auth_result(row), "登录成功")


@router.get("/demo/status")
def demo_status() -> dict:
    """Expose only whether the explicitly enabled demo entry is available."""

    return _success({"enabled": settings.DEMO_MODE})


@router.post("/demo")
def demo_login() -> dict:
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=404, detail="演示入口未启用")
    row = authenticate_user(settings.DEMO_USERNAME, settings.DEMO_PASSWORD)
    if row is None:
        raise HTTPException(status_code=503, detail="演示账号尚未初始化，请重启后端")
    return _success(_auth_result(row), "进入演示")


@router.get("/me")
def me(user: dict = Depends(current_user)) -> dict:
    return _success(user)


@router.post("/logout")
def logout(authorization: str | None = Header(default=None)) -> dict:
    delete_session(_extract_token(authorization))
    return _success(None, "已退出登录")
