"""Orchestrates the local Outbound-Guard audit pipeline."""

from __future__ import annotations

from typing import Any

from app.services.hard_rules import run_hard_rules
from app.services.precedent_matcher import run_precedent_matcher
from app.services.registration_strategy import build_registration_strategy
from app.services.rule_repository import get_rule, score_for_rule
from app.services.vision_agent import run_vision_agent


def _risk_level(score: int) -> str:
    if score >= 70:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _priority_for_score(score: int) -> str:
    if score >= 70:
        return "P0"
    if score >= 40:
        return "P1"
    return "P2"


def _dedupe_items(items: list[dict[str, Any]], keys: tuple[str, ...]) -> list[dict[str, Any]]:
    seen: set[tuple[str, ...]] = set()
    result: list[dict[str, Any]] = []
    for item in items:
        signature = tuple(str(item.get(key, "")) for key in keys)
        if signature in seen:
            continue
        seen.add(signature)
        result.append(item)
    return result


def _estimate_score(hit_rules: list[dict[str, Any]]) -> int:
    score = 18
    for hit_rule in hit_rules:
        if not hit_rule.get("applicable"):
            continue
        article = str(hit_rule.get("article") or "")
        content = str(hit_rule.get("content") or "")
        if "公共标志" in content or "重大法律风险" in content:
            score = max(score, 95)
        elif "完全相同" in str(hit_rule.get("similarityType") or ""):
            score = max(score, 82)
        elif "视觉相似候选" in str(hit_rule.get("note") or ""):
            score = max(score, 60)
        elif "驰名" in content or "高知名度" in str(hit_rule.get("note") or ""):
            score = max(score, 78)
        elif "缺少" in content or "不足" in content or "信息" in article:
            score = max(score, 48)
        elif "缺乏显著性" in content:
            score = max(score, 58)
        else:
            score = max(score, 55)

        score = max(score, int(hit_rule.get("similarityScore") or 0))
    return min(score, 100)


def _build_overall_result(risk_level: str, score: int, hit_rules: list[dict[str, Any]]) -> str:
    triggered = [rule for rule in hit_rules if rule.get("applicable")]
    if not triggered:
        return "当前有限范围内未命中明显风险；仍建议在正式提交前由越南代理人进行数据库复核。"

    if risk_level == "high":
        return f"发现高风险审查线索，综合风险分值 {score}/100。建议暂缓直接提交，先完成法律人工复核和标识调整。"
    if risk_level == "medium":
        return f"发现需关注的审查线索，综合风险分值 {score}/100。建议补充材料并进行人工复核后再提交。"
    return f"当前仅发现低风险或信息性提示，综合风险分值 {score}/100。可进入下一轮人工确认。"


def _build_suggestions(hit_rules: list[dict[str, Any]], score: int) -> list[dict[str, str]]:
    suggestions: list[dict[str, str]] = []
    priority = _priority_for_score(score)

    for hit_rule in hit_rules:
        if not hit_rule.get("applicable"):
            continue
        note = str(hit_rule.get("note") or "")
        title = "处理规则命中项"
        if "尼斯类别" in note:
            title = "补充尼斯分类"
        elif "商品或服务描述" in note:
            title = "细化商品/服务描述"
        elif "底账" in note or "相似候选" in note:
            title = "复核在先商标冲突"
        elif "中文" in note:
            title = "增强越南市场可识别性"
        elif "视觉" in note or "图形" in note:
            title = "进行图形人工复核"

        suggestions.append({"priority": priority, "title": title, "description": note})

    if not suggestions:
        suggestions.append(
            {
                "priority": "P2",
                "title": "进行正式提交前复核",
                "description": "当前本地规则未发现明确命中，但本系统不能替代越南主管机关数据库检索和律师审查。",
            }
        )

    return _dedupe_items(suggestions, ("title", "description"))[:6]


def _build_document_preview(
    req: dict[str, Any],
    risk_level: str,
    score: int,
    overall: str,
    hit_rules: list[dict[str, Any]],
    references: list[dict[str, Any]],
    suggestions: list[dict[str, str]],
) -> str:
    triggered_rules = [rule for rule in hit_rules if rule.get("applicable")]
    rule_lines = "\n".join(
        f"- {rule.get('article') or '未命名规则'}：{rule.get('note') or rule.get('content') or '需人工复核'}"
        for rule in triggered_rules[:6]
    ) or "- 当前本地规则库未发现明确命中项。"
    reference_lines = "\n".join(
        f"- [{reference.get('refType')}] {reference.get('title')}：{reference.get('summary')}"
        for reference in references[:6]
    ) or "- 暂无法律依据或商标底账引用。"
    suggestion_lines = "\n".join(
        f"- {item.get('priority')}｜{item.get('title')}：{item.get('description')}"
        for item in suggestions[:6]
    ) or "- 建议进行正式提交前人工复核。"

    return f"""# 越南商标合规初筛报告

## 一、基础信息
- 品牌名称：{req.get("brandName") or ""}
- 英文名称：{req.get("englishName") or ""}
- 尼斯分类：{req.get("niceClass") or ""}
- 商品/服务：{req.get("goodsServices") or req.get("businessDescription") or ""}

## 二、综合结论
{overall}

## 三、风险等级
- 等级：{risk_level}
- 分值：{score}/100
- 是否建议人工复核：{"是" if score >= 40 or triggered_rules else "否"}

## 四、规则命中摘要
{rule_lines}

## 五、引用依据
{reference_lines}

## 六、处置建议
{suggestion_lines}

## 七、后续操作清单
- 由法学队友复核规则命中项和引用依据是否准确。
- 如涉及在先商标线索，补充越南主管机关数据库检索。
- 如涉及视觉候选，保留设计过程、版本记录和独立创作证据。
- 正式提交前，由越南当地代理人确认商品/服务描述和尼斯分类。

## 八、使用限制
本报告基于本地规则库和本地商标底账生成，仅用于赛题产品演示和初筛，不构成越南法律意见。
"""


def run_audit(req: dict[str, Any]) -> dict[str, Any]:
    """Run the local three-layer audit pipeline."""

    hard = run_hard_rules(req)
    precedent = run_precedent_matcher(req)
    vision = run_vision_agent(req)
    registration_strategy = build_registration_strategy(req)

    hit_rules = _dedupe_items(
        hard["hitRules"] + precedent["hitRules"] + vision["hitRules"],
        ("article", "content", "similarityType", "note"),
    )
    references = _dedupe_items(
        hard["references"] + precedent["references"] + vision["references"],
        ("refType", "title", "source", "summary"),
    )

    score = _estimate_score(hit_rules)
    risk_level = _risk_level(score)
    overall = _build_overall_result(risk_level, score, hit_rules)
    manual_review_required = bool([rule for rule in hit_rules if rule.get("applicable")]) or score >= 40

    suggestions = _build_suggestions(hit_rules, score)

    return {
        "brandName": req.get("brandName") or "",
        "niceClass": req.get("niceClass") or "",
        "goodsServices": req.get("goodsServices") or req.get("businessDescription") or "",
        "riskLevel": risk_level,
        "riskScore": score,
        "overallResult": overall,
        "hitRules": hit_rules,
        "references": references,
        "suggestions": suggestions,
        "manualReviewRequired": manual_review_required,
        "radarData": vision.get("radarData", []),
        "matchedBrands": vision.get("matchedBrands", []),
        "documentPreview": _build_document_preview(req, risk_level, score, overall, hit_rules, references, suggestions),
        "registrationStrategy": registration_strategy,
    }
