export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new Response('ID required', { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: { result: true }
    });

    if (!analysis) {
      return new Response('Analysis not found', { status: 404 });
    }

    const result = JSON.parse(analysis.result as string ?? '{}');
    const html = result?.samplePageHtml;

    if (!html || typeof html !== 'string') {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb;color:#6b7280;text-align:center;padding:2rem;}</style></head><body><div><h2 style="color:#374151;margin-bottom:0.5rem;">No Sample Page Available</h2><p>This analysis doesn't include a sample landing page. Only ideas with a "Build" or "Pivot" verdict get a generated landing page.</p></div></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err: any) {
    console.error('Sample page error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
