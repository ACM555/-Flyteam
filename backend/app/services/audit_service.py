from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.config import settings
from app.database import get_task, update_task
from app.services.legal_engine import assess_absolute_rules
from app.services.trademark_service import find_text_conflicts, get_visual_benchmark_conflict
from app.services.vision_service import analyze_logo


def _load_cases() -> list[dict[str, Any]]:
    payload = json.loads(settings.case_db_path.read_text(encoding="utf-8"))
    return payload.get("records", [])


def _deduplicate_conflicts(conflicts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduplicated: dict[str, dict[str, Any]] = {}
    for conflict in conflicts:
        key = conflict.get("registrationNo") or f"{conflict.get('owner')}:{conflict.get('brandName')}"
        current = deduplicated.get(key)
        if current is None or conflict.get("similarityScore", 0) > current.get("similarityScore", 0):
            deduplicated[key] = conflict
    return sorted(deduplicated.values(), key=lambda item: item.get("similarityScore", 0), reverse=True)


def _recommendations(absolute_risk: bool, relative_risk: bool) -> list[dict[str, str]]:
    recommendations: list[dict[str, str]] = []
    if absolute_risk:
        recommendations.append(
            {
                "priority": "P0",
                "title": "补充越南语或拉丁文字识别要素",
                "description": "避免仅以汉字作为申请标志，并由越南执业代理人复核显著性与翻译表达。",
            }
        )
    if relative_risk:
        recommendations.extend(
            [
                {
                    "priority": "P0",
                    "title": "暂停当前图形提交与商业投放",
                    "description": "在完成图形重构和越南官方数据库近似检索前，暂停使用当前高风险识别要素。",
                },
                {
                    "priority": "P1",
                    "title": "开展重点权利人跨类检索",
                    "description": "针对冲突权利人的文字、图形和系列商标进行同类及跨类检索，并保留官方检索记录。",
                },
            ]
        )
    recommendations.append(
        {
            "priority": "P2",
            "title": "保全独立创作与首次使用证据",
            "description": "整理设计源文件、委托合同、修改记录、发布时间和商业使用材料，形成可核验时间线。",
        }
    )
    return recommendations


def _document_preview(
    brand_name: str,
    nice_class: str,
    overall_result: str,
    recommendations: list[dict[str, str]],
) -> str:
    recommendation_text = "\n".join(
        f"- [{item['priority']}] {item['title']}：{item['description']}" for item in recommendations
    )
    return f"""# 中国企业赴越商标防御性合规规划书

## 一、项目概况
审查对象：{brand_name}\n申请类别：{nice_class}

## 二、风险结论
{overall_result}

## 三、处置建议
{recommendation_text}

## 四、证据保全
建议保留商标设计源文件、委托协议、版本记录、首次公开及商业使用证据。

## 五、重要声明
本报告由公开数据和自动化规则生成，仅用于比赛演示与提交前风险筛查，不替代越南执业律师或商标代理人的正式法律意见。"""


def process_audit_task(task_id: str, image_path: Path) -> None:
    try:
        task = get_task(task_id)
        if task is None:
            raise RuntimeError("审查任务不存在")
        request = task["request"]
        update_task(task_id, status="processing", current_step=0, progress=15)

        legal = assess_absolute_rules(request["brandName"], request.get("englishName", ""))
        update_task(task_id, current_step=1, progress=45)

        vision = analyze_logo(image_path)
        text_conflicts = find_text_conflicts(
            request["brandName"],
            request.get("englishName", ""),
            request["niceClass"],
        )
        visual_conflict = get_visual_benchmark_conflict(vision.fourfold_score)
        conflicts = _deduplicate_conflicts(
            text_conflicts + ([visual_conflict] if visual_conflict else [])
        )
        relative_risk = bool(conflicts)
        update_task(task_id, current_step=2, progress=78)

        hit_rules = legal.hit_rules
        relative_score = max((conflict["similarityScore"] for conflict in conflicts), default=0)
        for rule in hit_rules:
            if rule["ruleType"] == "relative":
                rule["applicable"] = relative_risk
                rule["similarityType"] = (
                    conflicts[0]["similarityType"] if conflicts else ""
                )
                rule["similarityScore"] = relative_score
                rule["note"] = (
                    "本地商标库或图形基准检出跨类近似风险。"
                    if relative_risk
                    else "当前知识库未检出高置信度跨类攀附风险。"
                )

        references = list(legal.references)
        references.extend(
            {
                "refType": "trademark",
                "title": conflict["brandName"],
                "source": "IP Viet Nam public trademark search",
                "date": "",
                "registrationNo": conflict["registrationNo"],
                "summary": (
                    f"权利人：{conflict.get('owner') or '未知'}；类别："
                    f"{conflict.get('registeredClass') or '未标注'}；状态："
                    f"{conflict.get('status') or '未标注'}。"
                ),
                "relevance": (
                    f"{conflict['similarityType']}，评分 {conflict['similarityScore']}/100。"
                ),
                "sourceUrl": conflict.get("sourceUrl", ""),
            }
            for conflict in conflicts
        )

        precedents = [
            {
                "caseName": case["caseName"],
                "court": case.get("court", ""),
                "date": case.get("date", ""),
                "ruling": case.get("ruling", ""),
                "relevance": case.get("relevance", ""),
            }
            for case in _load_cases()
            if case.get("verified") and case.get("sourceUrl")
        ]

        score_candidates = [8]
        if legal.absolute_risk:
            score_candidates.append(legal.rejection_probability)
        if relative_score:
            score_candidates.append(relative_score)
        risk_score = min(100, max(score_candidates) + (5 if legal.absolute_risk and relative_risk else 0))
        risk_level = "high" if risk_score >= 75 else "medium" if risk_score >= 45 else "low"
        if legal.absolute_risk and relative_risk:
            overall_result = "同时检出显著性绝对驳回风险与跨类近似风险，建议暂缓提交并进行人工复核。"
        elif legal.absolute_risk:
            overall_result = "检出汉字显著性风险，建议补充越南语或拉丁文字识别要素后再申请。"
        elif relative_risk:
            overall_result = "检出文字或图形近似风险，建议暂停提交并完成权利冲突专项检索。"
        else:
            overall_result = "当前规则库与视觉基准未检出高风险项，可进入人工复核与正式检索阶段。"

        recommendations = _recommendations(legal.absolute_risk, relative_risk)
        visual_matches = [
            {
                "name": conflict["brandName"],
                "thumbnailUrl": conflict.get("thumbnailUrl") or "/lv-placeholder.svg",
                "matchScore": conflict["similarityScore"],
            }
            for conflict in conflicts
            if conflict["similarityType"].startswith("图形")
        ]
        submit_time = datetime.now(UTC).isoformat()
        result = {
            "taskId": task_id,
            "status": "done",
            "currentStep": 2,
            "progress": 100,
            "brandName": request["brandName"],
            "niceClass": request["niceClass"],
            "goodsServices": request["goodsServices"],
            "riskLevel": risk_level,
            "riskScore": risk_score,
            "overallResult": overall_result,
            "manualReviewRequired": risk_level != "low",
            "hitRules": hit_rules,
            "references": references,
            "summary": {
                "brandName": request["brandName"],
                "niceClass": request["niceClass"],
                "submitTime": submit_time,
                "riskLevel": risk_level,
                "riskScore": risk_score,
                "overallResult": overall_result,
            },
            "absolute": {
                "hasRisk": legal.absolute_risk,
                "rejectionProbability": legal.rejection_probability,
                "articles": [
                    {
                        "article": rule["article"],
                        "content": rule["content"],
                        "applicable": rule["applicable"],
                        "note": rule["note"],
                    }
                    for rule in hit_rules
                    if rule["ruleType"] == "absolute"
                ],
            },
            "relative": {
                "hasRisk": relative_risk,
                "conflicts": [
                    {
                        key: conflict[key]
                        for key in (
                            "brandName",
                            "registeredClass",
                            "registrationNo",
                            "similarityType",
                            "similarityScore",
                        )
                    }
                    for conflict in conflicts
                ],
                "precedents": precedents,
            },
            "visual": {
                "radarData": vision.radar_data,
                "matchedBrands": visual_matches,
                "analysisMode": "remote-assisted" if vision.model_analysis else "local-opencv",
                "summary": (
                    vision.model_analysis.get("summary")
                    if vision.model_analysis and vision.model_analysis.get("summary")
                    else vision.local_summary
                ),
            },
            "advice": {
                "recommendations": recommendations,
                "documentPreview": _document_preview(
                    request["brandName"], request["niceClass"], overall_result, recommendations
                ),
                "documentDownloadUrl": f"/api/audit/report/{task_id}/pdf",
            },
        }
        update_task(
            task_id,
            status="done",
            current_step=2,
            progress=100,
            result=result,
            error_message="",
        )
    except Exception as error:
        update_task(
            task_id,
            status="error",
            progress=100,
            error_message=str(error)[:500],
        )
    finally:
        image_path.unlink(missing_ok=True)
