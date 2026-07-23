from __future__ import annotations

import base64
import binascii
import json
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

import cv2
import httpx
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import settings


MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000


@dataclass(frozen=True)
class VisionAssessment:
    radar_data: list[dict[str, Any]]
    fourfold_score: int
    local_summary: str
    model_analysis: dict[str, Any] | None


def decode_logo(logo: str) -> bytes:
    encoded = logo.split(",", 1)[1] if logo.startswith("data:") and "," in logo else logo
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error) as error:
        raise ValueError("Logo 不是有效的 Base64 图片") from error
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise ValueError("Logo 图片为空或超过 5MB")
    return raw


def validate_and_normalize_image(raw: bytes) -> bytes:
    Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
    try:
        with Image.open(BytesIO(raw)) as image:
            image.verify()
        with Image.open(BytesIO(raw)) as image:
            normalized = ImageOps.exif_transpose(image).convert("RGB")
            if normalized.width * normalized.height > MAX_IMAGE_PIXELS:
                raise ValueError("Logo 图片像素尺寸过大")
            output = BytesIO()
            normalized.save(output, format="PNG", optimize=True)
            return output.getvalue()
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("仅支持有效的 JPG 或 PNG 图片") from error


def save_temporary_image(task_id: str, image_bytes: bytes) -> Path:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    target = settings.upload_dir / f"{task_id}.png"
    target.write_bytes(image_bytes)
    return target


def _binary_iou(left: np.ndarray, right: np.ndarray) -> float:
    left_mask = left > 0
    right_mask = right > 0
    union = np.count_nonzero(left_mask | right_mask)
    if union == 0:
        return 0.0
    intersection = np.count_nonzero(left_mask & right_mask)
    return float(intersection) / float(union)


def _local_analysis(image_path: Path) -> tuple[list[dict[str, Any]], int, str]:
    encoded_image = np.frombuffer(image_path.read_bytes(), dtype=np.uint8)
    image = cv2.imdecode(encoded_image, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("OpenCV 无法读取 Logo 图片")
    image = cv2.resize(image, (256, 256), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    if float(gray.mean()) < 127:
        gray = 255 - gray
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    foreground_density = float(np.count_nonzero(binary)) / binary.size
    vertical_symmetry = _binary_iou(binary, cv2.flip(binary, 1))
    horizontal_symmetry = _binary_iou(binary, cv2.flip(binary, 0))
    rotation_90 = _binary_iou(binary, cv2.rotate(binary, cv2.ROTATE_90_CLOCKWISE))
    rotation_180 = _binary_iou(binary, cv2.rotate(binary, cv2.ROTATE_180))
    rotation_270 = _binary_iou(binary, cv2.rotate(binary, cv2.ROTATE_90_COUNTERCLOCKWISE))
    fourfold = (rotation_90 + rotation_180 + rotation_270) / 3
    edges = cv2.Canny(gray, 70, 160)
    edge_density = float(np.count_nonzero(edges)) / edges.size
    moments = cv2.moments(binary)
    if moments["m00"]:
        center_x = moments["m10"] / moments["m00"] / 255
        center_y = moments["m01"] / moments["m00"] / 255
        center_balance = 1 - min(1, (abs(center_x - 0.5) + abs(center_y - 0.5)) * 2)
    else:
        center_balance = 0
    color_std = float(np.mean(np.std(image.astype(np.float32), axis=(0, 1))))
    density_fit = max(0, 1 - abs(foreground_density - 0.28) / 0.28)
    fourfold_score = round(
        100
        * (
            fourfold * 0.44
            + ((vertical_symmetry + horizontal_symmetry) / 2) * 0.20
            + density_fit * 0.16
            + center_balance * 0.12
            + min(1, edge_density / 0.18) * 0.08
        )
    )
    fourfold_score = max(0, min(100, fourfold_score))
    radar_data = [
        {"dimension": "几何轮廓", "target": round(fourfold * 100), "benchmark": 92},
        {
            "dimension": "色彩构成",
            "target": round(min(100, color_std / 64 * 100)),
            "benchmark": 35,
        },
        {"dimension": "线条密度", "target": round(min(100, edge_density / 0.18 * 100)), "benchmark": 76},
        {
            "dimension": "对称性",
            "target": round((vertical_symmetry + horizontal_symmetry) / 2 * 100),
            "benchmark": 94,
        },
        {"dimension": "视觉重心", "target": round(center_balance * 100), "benchmark": 90},
    ]
    summary = (
        "检测到明显四向对称与中心聚合结构。"
        if fourfold_score >= 68
        else "未检测到高置信度四瓣对称攀附特征。"
    )
    return radar_data, fourfold_score, summary


def _remote_analysis(image_bytes: bytes, local_features: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not settings.vision_api_url or not settings.vision_model:
        return None
    headers = {"Content-Type": "application/json"}
    if settings.vision_api_key:
        headers["Authorization"] = f"Bearer {settings.vision_api_key}"
    prompt = (
        "你是商标图形审查辅助模型。只分析图形，不作最终法律结论。"
        "请返回严格 JSON：{\"summary\":string,\"geometryRisk\":0-100,"
        "\"observations\":[string]}。本地特征为："
        + json.dumps(local_features, ensure_ascii=False)
    )
    payload = {
        "model": settings.vision_model,
        "temperature": 0,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "data:image/png;base64," + base64.b64encode(image_bytes).decode("ascii")
                        },
                    },
                ],
            }
        ],
    }
    try:
        with httpx.Client(timeout=settings.vision_timeout_seconds) as client:
            response = client.post(settings.vision_api_url, headers=headers, json=payload)
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            if isinstance(content, str) and content.startswith("```"):
                content = content.strip("`").removeprefix("json").strip()
            parsed = json.loads(content)
            return parsed if isinstance(parsed, dict) else None
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
        return None


def analyze_logo(image_path: Path) -> VisionAssessment:
    radar_data, fourfold_score, summary = _local_analysis(image_path)
    model_analysis = _remote_analysis(image_path.read_bytes(), radar_data)
    if model_analysis and isinstance(model_analysis.get("geometryRisk"), (int, float)):
        model_score = max(0, min(100, round(model_analysis["geometryRisk"])))
        fourfold_score = round(fourfold_score * 0.7 + model_score * 0.3)
    return VisionAssessment(
        radar_data=radar_data,
        fourfold_score=fourfold_score,
        local_summary=summary,
        model_analysis=model_analysis,
    )
