"""
Section 10 & 11: PDF Report Export using ReportLab.
"""
from io import BytesIO
from typing import Dict
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def build_report_pdf(user_name: str, period: str, report_data: Dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title="InformedDiet Nutrition Report")
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"<b>InformedDiet — {period.title()} Nutrition Report</b>", styles["Title"]))
    elements.append(Paragraph(f"User: {user_name or 'InformedDiet User'}", styles["Normal"]))
    elements.append(Spacer(1, 14))

    summary = report_data.get("summary", {})
    summary_rows = [
        ["Metric", "Average / Total"],
        ["Avg Daily Calories", f"{summary.get('avg_calories', 0)} kcal"],
        ["Avg Daily Protein", f"{summary.get('avg_protein', 0)} g"],
        ["Avg Daily Carbs", f"{summary.get('avg_carbs', 0)} g"],
        ["Avg Daily Fat", f"{summary.get('avg_fat', 0)} g"],
        ["Avg Daily Water", f"{summary.get('avg_water_ml', 0)} ml"],
        ["Weight Change", f"{summary.get('weight_change_kg', 0)} kg"],
    ]
    t = Table(summary_rows, colWidths=[220, 220])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 16))

    insights = report_data.get("insights", [])
    if insights:
        elements.append(Paragraph("<b>Key Insights</b>", styles["Heading2"]))
        for ins in insights:
            elements.append(Paragraph(f"• {ins}", styles["Normal"]))
        elements.append(Spacer(1, 12))

    elements.append(Paragraph(
        "<i>Health Disclaimer: InformedDiet provides general nutritional guidance and does not replace a doctor or dietitian.</i>",
        styles["Italic"],
    ))

    doc.build(elements)
    return buf.getvalue()
