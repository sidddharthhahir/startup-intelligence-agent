export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Generates report HTML from an analysis result for PDF conversion.
 */
function buildReportHtml(idea: string, result: any, createdAt: string): string {
  const r = result ?? {};
  const research = r.researchSummary ?? {};
  const mvp = r.mvpPlan ?? {};
  const monetization = r.monetization ?? {};
  const gtm = r.goToMarket ?? {};
  const pitch = typeof r.pitchSummary === 'object' ? r.pitchSummary : null;
  const reasoning = r.reasoningBasis ?? r.evidenceSources ?? [];

  const bulletList = (items: string[] = []) =>
    items.length ? items.map(i => `<li>${escHtml(i)}</li>`).join('') : '<li>N/A</li>';

  const escHtml = (s: string) =>
    (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const scoreColor = (r.ideaScore ?? 0) >= 7 ? '#16a34a' : (r.ideaScore ?? 0) >= 4 ? '#d97706' : '#dc2626';
  const verdictColor = (r.verdict ?? '').toLowerCase() === 'build' ? '#16a34a' : (r.verdict ?? '').toLowerCase() === 'pivot' ? '#d97706' : '#dc2626';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 13px; }
  h1 { font-size: 22px; margin-bottom: 4px; color: #1a1a2e; }
  h2 { font-size: 16px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #e5e7eb; color: #374151; }
  h3 { font-size: 13px; margin: 12px 0 4px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  p { margin: 4px 0; }
  ul, ol { padding-left: 20px; margin: 4px 0; }
  li { margin: 2px 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 3px solid #7c3aed; }
  .score-badge { display: inline-block; padding: 8px 16px; border-radius: 8px; color: white; font-size: 24px; font-weight: bold; }
  .verdict-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; color: white; font-size: 12px; font-weight: 600; margin-left: 8px; }
  .meta { color: #6b7280; font-size: 11px; margin-top: 4px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card { background: #f9fafb; border-radius: 8px; padding: 12px; border: 1px solid #e5e7eb; }
  .card-title { font-size: 11px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .idea-text { background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 8px 0 20px; font-style: italic; color: #374151; }
  .tam-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .tam-card { background: #ede9fe; padding: 8px; border-radius: 6px; text-align: center; }
  .tam-label { font-size: 10px; font-weight: 700; color: #7c3aed; }
  .tam-value { font-size: 12px; color: #1a1a2e; margin-top: 2px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 10px; }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>Startup Intelligence Report</h1>
    <div class="meta">Generated ${escHtml(createdAt)}</div>
  </div>
  <div style="text-align:right">
    <span class="score-badge" style="background:${scoreColor}">${r.ideaScore ?? 0}/10</span>
    <span class="verdict-badge" style="background:${verdictColor}">${escHtml(r.verdict ?? 'N/A')}</span>
    <div class="meta" style="margin-top:6px">Confidence: ${escHtml(r.confidence ?? 'N/A')} | Demand: ${escHtml(r.demandLevel ?? 'N/A')}</div>
  </div>
</div>

<div class="idea-text">${escHtml(idea)}</div>

${r.verdictReasoning ? `<p><strong>Verdict Reasoning:</strong> ${escHtml(r.verdictReasoning)}</p>` : ''}
${r.confidenceReasoning ? `<p style="margin-top:4px;color:#6b7280"><em>Confidence: ${escHtml(r.confidenceReasoning)}</em></p>` : ''}

<h2>Market Research</h2>
<div class="grid-2">
  <div><h3>Market Size</h3><p>${escHtml(research.marketSize ?? 'N/A')}</p></div>
  <div><h3>Target Audience</h3><p>${escHtml(research.targetAudience ?? 'N/A')}</p></div>
</div>
<div class="tam-grid" style="margin-top:8px">
  <div class="tam-card"><div class="tam-label">TAM</div><div class="tam-value">${escHtml(research.tam ?? 'N/A')}</div></div>
  <div class="tam-card"><div class="tam-label">SAM</div><div class="tam-value">${escHtml(research.sam ?? 'N/A')}</div></div>
  <div class="tam-card"><div class="tam-label">SOM</div><div class="tam-value">${escHtml(research.som ?? 'N/A')}</div></div>
</div>
${research.buyerPersona ? `<div style="margin-top:8px"><h3>Ideal First Customer</h3><p><em>${escHtml(research.buyerPersona)}</em></p></div>` : ''}
<div class="grid-2" style="margin-top:8px">
  <div><h3>Key Trends</h3><ul>${bulletList(research.trends)}</ul></div>
  <div><h3>Competitors</h3><ul>${bulletList(research.competitors)}</ul></div>
</div>
${(research.competitorWeaknesses ?? []).length > 0 ? `<div style="margin-top:8px"><h3>Competitor Weaknesses</h3><ul>${bulletList(research.competitorWeaknesses)}</ul></div>` : ''}

<h2>SWOT Analysis</h2>
<div class="grid-2">
  <div class="card"><div class="card-title">Strengths</div><ul>${bulletList(r.strengths)}</ul></div>
  <div class="card"><div class="card-title">Weaknesses</div><ul>${bulletList(r.weaknesses)}</ul></div>
  <div class="card"><div class="card-title">Risks</div><ul>${bulletList(r.risks)}</ul></div>
  <div class="card"><div class="card-title">Opportunities</div><ul>${bulletList(r.opportunities)}</ul></div>
</div>
<div style="margin-top:8px"><h3>Differentiation</h3><ul>${bulletList(r.differentiation)}</ul></div>

<h2>MVP Plan</h2>
<div class="grid-2">
  <div><h3>Core Features</h3><ul>${bulletList(mvp.coreFeatures)}</ul></div>
  <div><h3>User Flow</h3><ol>${bulletList(mvp.userFlow)}</ol></div>
  <div><h3>Tech Stack</h3><ul>${bulletList(mvp.techStack)}</ul></div>
  <div>
    <h3>Architecture</h3><p>${escHtml(mvp.architecture ?? 'N/A')}</p>
    ${mvp.buildTimeline ? `<h3 style="margin-top:8px">Build Timeline</h3><p>${escHtml(mvp.buildTimeline)}</p>` : ''}
  </div>
</div>

<h2>Monetization</h2>
<div class="grid-2">
  <div><h3>Model</h3><p>${escHtml(monetization.model ?? 'N/A')}</p></div>
  <div><h3>Revenue Streams</h3><ul>${bulletList(monetization.revenueStreams)}</ul></div>
  <div><h3>Pricing Tiers</h3><ul>${bulletList(monetization.pricingTiers)}</ul></div>
  ${monetization.unitEconomics ? `<div><h3>Unit Economics</h3><p>${escHtml(monetization.unitEconomics)}</p></div>` : ''}
</div>

<h2>Go-To-Market Strategy</h2>
<div class="grid-2">
  <div><h3>Channels</h3><ul>${bulletList(gtm.channels)}</ul></div>
  <div><h3>Strategy</h3><p>${escHtml(gtm.strategy ?? 'N/A')}</p></div>
  <div><h3>Timeline</h3><p>${escHtml(gtm.timeline ?? 'N/A')}</p></div>
  ${gtm.firstHundredUsers ? `<div><h3>First 100 Users</h3><p>${escHtml(gtm.firstHundredUsers)}</p></div>` : ''}
</div>

${pitch ? `
<h2>Pitch Summary</h2>
<div class="grid-2">
  <div><h3>Problem</h3><p>${escHtml(pitch.problem ?? 'N/A')}</p></div>
  <div><h3>Solution</h3><p>${escHtml(pitch.solution ?? 'N/A')}</p></div>
  <div><h3>Market</h3><p>${escHtml(pitch.market ?? 'N/A')}</p></div>
  <div><h3>Product</h3><p>${escHtml(pitch.product ?? 'N/A')}</p></div>
  <div><h3>Business Model</h3><p>${escHtml(pitch.businessModel ?? 'N/A')}</p></div>
  <div><h3>Unique Advantage</h3><p>${escHtml(pitch.uniqueAdvantage ?? 'N/A')}</p></div>
</div>
` : ''}

${reasoning.length > 0 ? `
<h2>Reasoning Basis</h2>
<ul>${reasoning.map((s: string) => `<li>${escHtml(s)}</li>`).join('')}</ul>
` : ''}

<div class="footer">Startup Intel — AI-Powered Due Diligence Report</div>

</body>
</html>`;
}

/**
 * POST /api/export-pdf
 * Returns the report as an HTML string so the client can open it in a new
 * window and trigger the browser's native print-to-PDF dialog.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id;

    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({ where: { id } });
    if (!analysis) {
      return Response.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const createdAt = analysis.createdAt
      ? new Date(analysis.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : 'Unknown';

    const html = buildReportHtml(analysis.idea, JSON.parse(analysis.result ?? '{}'), createdAt);

    return Response.json({ html });
  } catch (err: any) {
    console.error('Export-PDF error:', err);
    return Response.json(
      { error: err?.message ?? 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
