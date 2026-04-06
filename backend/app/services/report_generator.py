import os
from weasyprint import HTML
from app.core.database import AsyncSessionLocal
from app.models.ioc import IOC
from app.models.cve import CVE
from sqlalchemy.future import select
from sqlalchemy import desc
from datetime import datetime, timedelta

async def generate_pdf_report(period_days: int = 7, include_sections: list = None):
    async with AsyncSessionLocal() as db:
        cutoff = datetime.utcnow() - timedelta(days=period_days)
        
        # Stats
        res_iocs = await db.execute(select(IOC.id).where(IOC.created_at >= cutoff))
        iocs_count = len(res_iocs.scalars().all())
        
        res_cves = await db.execute(select(CVE).where(CVE.created_at >= cutoff, CVE.cvss_v3_score >= 9.0))
        cves_crit = res_cves.scalars().all()
        top_cves = cves_crit[:10]
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Helvetica', sans-serif; color: #333; }}
                h1 {{ color: #020617; border-bottom: 3px solid #0ea5e9; padding-bottom: 15px; text-transform: uppercase; font-size: 24px; }}
                h2 {{ color: #0f172a; margin-top: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 15px; page-break-inside: avoid; }}
                th, td {{ border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; line-height: 1.4; }}
                th {{ background-color: #f8fafc; font-weight: bold; }}
                .summary {{ background: #f1f5f9; padding: 20px; border-left: 5px solid #0ea5e9; margin: 30px 0; border-radius: 0 8px 8px 0; }}
                .footer {{ position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }}
                @page {{ margin: 2.5cm; @bottom-right {{ content: counter(page) " of " counter(pages); }} }}
            </style>
        </head>
        <body>
            <h1>ThreatLens Threat Intelligence Report</h1>
            <p style="color:#64748b; font-size:14px;"><strong>Generated:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC<br/>
            <strong>Evaluation Period:</strong> Last {period_days} days</p>
            
            <div class="summary">
                <h2 style="margin-top:0; border:none; padding:0;">Executive Summary</h2>
                <ul style="line-height:1.8;">
                    <li><strong>Total Network Malicious IOCs Processed:</strong> {iocs_count} unique indicators mapped into intelligence engine.</li>
                    <li><strong>Critical High-Impact CVEs (CVSS &ge; 9.0):</strong> {len(cves_crit)} active severe vulnerabilities monitored internally.</li>
                </ul>
            </div>
            
            <h2>Top Critical Vulnerabilities Matrix</h2>
            <table>
                <tr><th style="width: 20%;">CVE Identifier</th><th style="width: 10%;">CVSS</th><th style="width: 15%;">CISA KEV</th><th>Description Summary</th></tr>
                {"".join([f'<tr><td>{c.cve_id}</td><td>{c.cvss_v3_score}</td><td>{"Yes" if getattr(c, "is_kev", False) else "No"}</td><td style="font-size:12px;">{str(c.description)[:150]}...</td></tr>' for c in top_cves])}
            </table>
            
            <div class="footer">Confidential & Proprietary Intelligence Report • Generated Automatically by ThreatLens Pipeline</div>
        </body>
        </html>
        """
        
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
