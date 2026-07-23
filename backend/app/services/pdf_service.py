from __future__ import annotations

from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def _text(value: object, fallback: str = "待补充") -> str:
    text = str(value or "").strip()
    return escape(text or fallback)


def _risk_label(level: object) -> str:
    return {"high": "高风险", "medium": "中风险", "low": "低风险"}.get(str(level), "待评估")


def _table(rows: list[list[str]], widths: list[float], header: bool = False) -> Table:
    table = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    style = [
        ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    if header:
        style.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f3d66")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ]
        )
    else:
        style.extend(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eff6ff")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#0f3d66")),
            ]
        )
    table.setStyle(TableStyle(style))
    return table


def build_audit_pdf(result: dict) -> bytes:
    output = BytesIO()
    document = SimpleDocTemplate(
        output,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"{result.get('brandName', '品牌')}商标合规审查报告",
        author="Outbound Guard",
    )
    styles = getSampleStyleSheet()
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="STSong-Light",
        fontSize=10,
        leading=16,
        textColor=colors.HexColor("#1f2937"),
        wordWrap="CJK",
        spaceAfter=7,
    )
    title = ParagraphStyle(
        "Title",
        parent=body,
        fontSize=21,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0f3d66"),
        spaceAfter=8,
    )
    heading = ParagraphStyle(
        "Heading",
        parent=body,
        fontSize=14,
        leading=20,
        textColor=colors.HexColor("#0f3d66"),
        spaceBefore=11,
        spaceAfter=7,
    )
    muted = ParagraphStyle("Muted", parent=body, fontSize=8.5, leading=13, textColor=colors.HexColor("#64748b"))

    summary = result.get("summary", {})
    story = [
        Paragraph("商标合规审查报告", title),
        Paragraph("Outbound Guard 自动化风险筛查", body),
        Spacer(1, 6 * mm),
        _table(
            [
                ["品牌名称", _text(result.get("brandName") or summary.get("brandName"))],
                ["尼斯类别", _text(result.get("niceClass") or summary.get("niceClass"))],
                ["风险等级", _risk_label(result.get("riskLevel"))],
                ["风险评分", f"{result.get('riskScore', 0)}/100"],
                ["生成时间", _text(result.get("generatedAt") or summary.get("submitTime"))],
            ],
            [34 * mm, 122 * mm],
        ),
        Spacer(1, 7 * mm),
        Paragraph("审查结论", heading),
        Paragraph(_text(result.get("overallResult")), body),
    ]

    if result.get("manualReviewRequired"):
        story.extend(
            [
                Paragraph("人工复核", heading),
                Paragraph("该结果包含高影响风险信号。请在提交、商业使用或对外发布前，由当地执业律师或商标代理人完成正式检索和材料复核。", body),
            ]
        )

    recommendations = result.get("advice", {}).get("recommendations", [])
    if recommendations:
        story.append(Paragraph("建议行动", heading))
        for item in recommendations:
            story.append(Paragraph(f"<b>[{_text(item.get('priority'))}] {_text(item.get('title'))}</b><br/>{_text(item.get('description'))}", body))

    evidence = result.get("evidence", [])
    if evidence:
        story.append(Paragraph("证据与判断依据", heading))
        evidence_rows = [["依据", "来源与时间", "说明"]]
        basis_label = {"rule": "规则", "evidence": "证据匹配", "heuristic": "辅助判断"}
        for item in evidence:
            evidence_rows.append(
                [
                    basis_label.get(item.get("basis"), "证据"),
                    f"{_text(item.get('source'))}<br/>{_text(item.get('retrievedAt'))}",
                    f"<b>{_text(item.get('title'))}</b><br/>{_text(item.get('summary'))}",
                ]
            )
        story.append(_table(evidence_rows, [24 * mm, 47 * mm, 85 * mm], header=True))

    references = result.get("references", [])
    if references:
        story.append(Paragraph("法律与数据来源", heading))
        for reference in references:
            story.append(
                Paragraph(
                    f"<b>{_text(reference.get('title'))}</b><br/>"
                    f"来源：{_text(reference.get('source'))}；编号：{_text(reference.get('registrationNo'))}<br/>"
                    f"{_text(reference.get('summary'))}",
                    muted,
                )
            )

    story.extend(
        [
            Spacer(1, 8 * mm),
            Paragraph("重要声明", heading),
            Paragraph(
                "本报告基于公开数据、内置规则和自动化图形特征分析生成，仅提供商标合规辅助与提交前风险提示，不构成法律意见或注册结果承诺。最终申请策略应由具备当地执业资格的律师或商标代理人结合完整证据和最新审查实践确认。",
                muted,
            ),
        ]
    )
    document.build(story)
    return output.getvalue()
