export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl?.searchParams;
    const limit = Math.min(parseInt(searchParams?.get('limit') ?? '50', 10) || 50, 100);
    const search = searchParams?.get('search')?.trim() ?? '';
    const verdict = searchParams?.get('verdict')?.trim() ?? '';

    const where: any = {};
    if (search) {
      where.idea = { contains: search };
    }
    if (verdict && ['Build', 'Pivot', 'Drop'].includes(verdict)) {
      where.verdict = verdict;
    }

    const analyses = await prisma.analysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        idea: true,
        score: true,
        confidence: true,
        verdict: true,
        createdAt: true,
        result: true
      }
    });

    const serialized = (analyses ?? []).map((a: any) => ({
      ...(a ?? {}),
      result: JSON.parse(a?.result ?? '{}'),
      createdAt: a?.createdAt?.toISOString?.() ?? ''
    }));

    return Response.json(serialized);
  } catch (err: any) {
    console.error('Fetch analyses error:', err);
    return Response.json({ error: err?.message ?? 'Failed to fetch analyses' }, { status: 500 });
  }
}
