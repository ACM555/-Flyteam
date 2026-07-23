from fastapi import APIRouter

from app.api.audit import _task_store
from app.core.config import settings

router = APIRouter(tags=["系统"])


@router.get(
    "/health",
    summary="健康检查",
    description="检查 API 服务是否正常运行。前端可用于启动时探测后端可用性。",
    responses={
        200: {
            "description": "服务正常",
            "content": {
                "application/json": {
                    "example": {"status": "ok", "version": "1.0.0"},
                },
            },
        },
    },
)
async def health_check() -> dict[str, str]:
    """返回服务健康状态和当前 API 版本。"""

    return {"status": "ok", "version": settings.APP_VERSION}


@router.get(
    "/statistics",
    summary="首页统计",
    description="返回当前内存任务中的审查数量与高风险数量，用于首页统计卡片。",
)
async def statistics() -> dict[str, object]:
    """返回首页统计数据。"""

    done_results = [
        task.get("result")
        for task in _task_store.values()
        if task.get("status") == "done" and task.get("result")
    ]
    high_risk_count = sum(1 for result in done_results if result.get("riskLevel") == "high")
    return {
        "code": 0,
        "message": "success",
        "data": {
            "auditedBrands": len(done_results),
            "highRiskBlocked": high_risk_count,
        },
    }
