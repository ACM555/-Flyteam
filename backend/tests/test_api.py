from __future__ import annotations

import base64
import os
import time
from io import BytesIO
from pathlib import Path

TEST_RUNTIME = Path(__file__).resolve().parent / ".runtime"
os.environ["DATABASE_PATH"] = str(TEST_RUNTIME / "test.sqlite3")
os.environ["UPLOAD_DIR"] = str(TEST_RUNTIME / "uploads")
os.environ.setdefault("SUPERADMIN_PASSWORD", "test-admin-password-2026")

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.core.config import settings
from app.database import get_task, reset_database
from app.main import app


def image_base64(*, fourfold: bool) -> str:
    image = Image.new("RGB", (240, 240), "white")
    draw = ImageDraw.Draw(image)
    if fourfold:
        for box in ((85, 30, 155, 100), (140, 85, 210, 155), (85, 140, 155, 210), (30, 85, 100, 155)):
            draw.ellipse(box, outline="black", width=12)
    else:
        draw.line((35, 195, 205, 45), fill="black", width=12)
        draw.rectangle((45, 150, 105, 205), outline="black", width=8)
    output = BytesIO()
    image.save(output, format="PNG")
    return base64.b64encode(output.getvalue()).decode("ascii")


def submit_payload(*, safe: bool) -> dict:
    return {
        "brandName": "Mộc Lan" if safe else "墨兰奶白",
        "englishName": "Moc Lan" if safe else "",
        "niceClass": "第25类-服装鞋帽" if safe else "第43类-餐饮服务",
        "goodsServices": "原创服装品牌及线上线下服装销售服务" if safe else "茶饮及餐饮服务",
        "logo": image_base64(fourfold=not safe),
    }


def setup_module() -> None:
    reset_database()
    upload_dir = Path(settings.UPLOAD_DIR)
    if upload_dir.exists():
        for path in upload_dir.glob("*"):
            path.unlink()


def login(client: TestClient, username: str = "superadmin", password: str | None = None) -> str:
    response = client.post(
        "/api/auth/login",
        json={"username": username, "password": password or settings.SUPERADMIN_PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["data"]["token"]


def poll_result(client: TestClient, task_id: str, headers: dict[str, str]) -> dict:
    for _ in range(7):
        response = client.get(f"/api/audit/result/{task_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()["data"]
        if data["status"] in {"done", "error"}:
            return data
        time.sleep(1)
    raise AssertionError("审查任务未在测试窗口内完成")


def test_health_and_safe_audit() -> None:
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"

        admin_token = login(client)
        headers = {"Authorization": f"Bearer {admin_token}"}
        me = client.get("/api/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["data"]["role"] == "superadmin"

        overview = client.get("/api/platform/overview", headers=headers)
        assert overview.status_code == 200
        assert len(overview.json()["data"]["modules"]) == 6

        countries = client.get("/api/rules/countries", headers=headers)
        assert countries.status_code == 200
        assert any(item["country"] == "越南" for item in countries.json()["data"])

        brands = client.get("/api/brands", headers=headers)
        assert brands.status_code == 200
        assert any(item["name"] == "墨兰奶白" for item in brands.json()["data"])

        alerts = client.get(
            "/api/monitoring/alerts", headers=headers
        )
        assert alerts.status_code == 200
        assert any(item["severity"] == "high" for item in alerts.json()["data"])

        data_sources = client.get(
            "/api/data-sources/status", headers=headers
        )
        assert data_sources.status_code == 200
        assert len(data_sources.json()["data"]) >= 4

        created = client.post("/api/audit", json=submit_payload(safe=True), headers=headers)
        assert created.status_code == 202
        task_id = created.json()["data"]["taskId"]
        data = poll_result(client, task_id, headers)
        assert data["status"] == "done"
        assert data["riskLevel"] == "low"
        assert data["absolute"]["hasRisk"] is False
        assert data["relative"]["hasRisk"] is False
        assert data["intelligence"]["registrationStrategy"]["route"]

        admin_tasks = client.get(
            "/api/admin/tasks", headers=headers
        )
        assert admin_tasks.status_code == 200
        assert any(item["taskId"] == task_id for item in admin_tasks.json()["data"])

        admin_users = client.get(
            "/api/admin/users", headers=headers
        )
        assert admin_users.status_code == 200
        assert any(item["role"] == "superadmin" for item in admin_users.json()["data"])

        system_status = client.get(
            "/api/admin/system-status", headers=headers
        )
        assert system_status.status_code == 200
        assert system_status.json()["data"]["database"] == "online"

        reports = client.get("/api/reports", headers=headers)
        assert reports.status_code == 200
        assert any(item["taskId"] == task_id for item in reports.json()["data"])

        forbidden = client.get("/api/admin/tasks")
        assert forbidden.status_code == 401

        protected_without_token = client.get("/api/brands")
        assert protected_without_token.status_code == 401


def test_high_risk_audit_and_pdf() -> None:
    with TestClient(app) as client:
        admin_token = login(client)
        headers = {"Authorization": f"Bearer {admin_token}"}
        created = client.post("/api/audit", json=submit_payload(safe=False), headers=headers)
        assert created.status_code == 202
        task_id = created.json()["data"]["taskId"]
        result = poll_result(client, task_id, headers)
        assert result["status"] == "done"
        assert result["riskLevel"] == "high"
        assert result["absolute"]["hasRisk"] is True
        assert result["relative"]["hasRisk"] is True
        assert result["intelligence"]["crossClassShield"]["triggered"] is True
        assert result["intelligence"]["refusalHistory"]["triggered"] is True
        assert result["intelligence"]["culturalReview"]["triggered"] is True
        assert result["advice"]["documentDownloadUrl"].endswith(f"/{task_id}/pdf")

        pdf = client.get(f"/api/audit/report/{task_id}/pdf", headers=headers)
        assert pdf.status_code == 200
        assert pdf.headers["content-type"].startswith("application/pdf")
        assert pdf.content.startswith(b"%PDF")
        assert len(pdf.content) > 1500


def test_invalid_logo_and_missing_task() -> None:
    with TestClient(app) as client:
        registered = client.post(
            "/api/auth/register",
            json={"username": "demo_user", "password": "demo1234", "company": "Demo Co"},
        )
        assert registered.status_code == 200
        user_token = registered.json()["data"]["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        assert registered.json()["data"]["user"]["role"] == "user"

        duplicate = client.post(
            "/api/auth/register",
            json={"username": "demo_user", "password": "demo1234"},
        )
        assert duplicate.status_code == 409

        payload = submit_payload(safe=True)
        payload["logo"] = "not-valid-base64!!"
        invalid = client.post("/api/audit", json=payload, headers=user_headers)
        assert invalid.status_code == 422
        assert "Logo" in invalid.json()["detail"]

        missing = client.get("/api/audit/result/not-found", headers=user_headers)
        assert missing.status_code == 404
        assert "任务不存在" in missing.json()["detail"]


def test_audit_task_is_user_scoped_and_persisted() -> None:
    with TestClient(app) as client:
        owner = client.post(
            "/api/auth/register",
            json={"username": "task_owner", "password": "demo1234", "company": "Owner Co"},
        )
        other = client.post(
            "/api/auth/register",
            json={"username": "task_other", "password": "demo1234", "company": "Other Co"},
        )
        assert owner.status_code == 200
        assert other.status_code == 200
        owner_headers = {"Authorization": f"Bearer {owner.json()['data']['token']}"}
        other_headers = {"Authorization": f"Bearer {other.json()['data']['token']}"}

        created = client.post("/api/audit", json=submit_payload(safe=True), headers=owner_headers)
        assert created.status_code == 202
        task_id = created.json()["data"]["taskId"]
        stored = get_task(task_id)
        assert stored is not None
        assert stored["user_id"] == owner.json()["data"]["user"]["userId"]

        hidden = client.get(f"/api/audit/result/{task_id}", headers=other_headers)
        assert hidden.status_code == 404
        visible = client.get(f"/api/audit/result/{task_id}", headers=owner_headers)
        assert visible.status_code == 200


def teardown_module() -> None:
    upload_dir = Path(settings.UPLOAD_DIR)
    if upload_dir.exists():
        for path in upload_dir.glob("*"):
            path.unlink()
