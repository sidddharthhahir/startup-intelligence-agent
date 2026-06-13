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
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id }
    });

    if (!analysis) {
      return Response.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return Response.json({
      ...analysis,
      result: JSON.parse(analysis.result ?? '{}'),
      createdAt: analysis?.createdAt?.toISOString?.() ?? ''
    });
  } catch (err: any) {
    console.error('Fetch analysis error:', err);
    return Response.json({ error: err?.message ?? 'Failed to fetch analysis' }, { status: 500 });
  }
}
