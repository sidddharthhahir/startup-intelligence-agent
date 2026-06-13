'use client';

import { useEffect, useState } from 'react';
import { AnalysisDashboard } from '../../../_components/analysis-dashboard';
import type { AnalysisRecord } from '@/lib/analysis-types';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function AnalysisDetailView({ id }: { id: string }) {
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analyses/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Analysis not found');
          throw new Error('Failed to load analysis');
        }
        const data = await res.json();
        setAnalysis(data);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">{error || 'Analysis not found'}</p>
        <Link href="/" className="text-sm text-primary hover:underline">Go back to home</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Analysis Report</h1>
        <p className="text-muted-foreground text-sm mt-1">{analysis.idea}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : ''}
        </p>
      </div>

      <AnalysisDashboard result={analysis.result} analysisId={analysis.id} />
    </div>
  );
}
