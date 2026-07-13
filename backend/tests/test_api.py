from __future__ import annotations

import base64
import os
from io import BytesIO
from pathlib import Path

TEST_RUNTIME = Path(__file__).resolve().parent / ".runtime"
os.environ["DATABASE_PATH"] = str(TEST_RUNTIME / "test.sqlite3")
os.environ["UPLOAD_DIR"] = str(TEST_RUNTIME / "uploads")

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.config import settings
from app.database import reset_database
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
        "goodsServices": "原创服装品牌" if safe else "茶饮及餐饮服务",
        "logo": image_base64(fourfold=not safe),
    }


def setup_module() -> None:
    reset_database()
    if settings.upload_dir.exists():
        for path in settings.upload_dir.glob("*"):
            path.unlink()


def test_health_and_safe_audit() -> None:
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["data"]["status"] == "ok"

        created = client.post("/api/audit", json=submit_payload(safe=True))
        assert created.status_code == 202
        task_id = created.json()["data"]["taskId"]
        result = client.get(f"/api/audit/result/{task_id}")
        assert result.status_code == 200
        data = result.json()["data"]
        assert data["status"] == "done"
        assert data["riskLevel"] == "low"
        assert data["absolute"]["hasRisk"] is False
        assert data["relative"]["hasRisk"] is False


def test_high_risk_audit_and_pdf() -> None:
    with TestClient(app) as client:
        created = client.post("/api/audit", json=submit_payload(safe=False))
        assert created.status_code == 202
        task_id = created.json()["data"]["taskId"]
        result = client.get(f"/api/audit/result/{task_id}").json()["data"]
        assert result["status"] == "done"
        assert result["riskLevel"] == "high"
        assert result["absolute"]["hasRisk"] is True
        assert result["relative"]["hasRisk"] is True
        assert result["advice"]["documentDownloadUrl"].endswith(f"/{task_id}/pdf")

        pdf = client.get(f"/api/audit/report/{task_id}/pdf")
        assert pdf.status_code == 200
        assert pdf.headers["content-type"].startswith("application/pdf")
        assert pdf.content.startswith(b"%PDF")
        assert len(pdf.content) > 1500


def test_invalid_logo_and_missing_task() -> None:
    with TestClient(app) as client:
        payload = submit_payload(safe=True)
        payload["logo"] = "not-valid-base64!!"
        invalid = client.post("/api/audit", json=payload)
        assert invalid.status_code == 422
        assert invalid.json()["code"] == 422

        missing = client.get("/api/audit/result/not-found")
        assert missing.status_code == 404
        assert missing.json()["code"] == 404


def teardown_module() -> None:
    if settings.upload_dir.exists():
        for path in settings.upload_dir.glob("*"):
            path.unlink()
