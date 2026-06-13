'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, ChevronDown, ChevronUp, Loader2, Inbox, Search, X, ExternalLink } from 'lucide-react';
import type { AnalysisRecord } from '@/lib/analysis-types';
import { AnalysisDashboard } from '../../_components/analysis-dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

function getVerdictStyle(verdict: string) {
  const v = verdict?.toLowerCase?.() ?? '';
  if (v === 'build') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (v === 'pivot') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  return 'bg-red-500/10 text-red-600 dark:text-red-400';
}

function getScoreColor(score: number) {
  if (score >= 7) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 4) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

const VERDICTS = ['All', 'Build', 'Pivot', 'Drop'] as const;

export function HistoryList() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('All');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (verdictFilter && verdictFilter !== 'All') params.set('verdict', verdictFilter);
      const res = await fetch(`/api/analyses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data ?? []);
      }
    } catch (err: any) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, verdictFilter]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ideas..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {VERDICTS.map(v => (
            <button
              key={v}
              onClick={() => setVerdictFilter(v)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                verdictFilter === v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}

      {!loading && (analyses?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">
            {debouncedSearch || verdictFilter !== 'All' ? 'No matching analyses' : 'No analyses yet'}
          </p>
          <p className="text-sm">
            {debouncedSearch || verdictFilter !== 'All' ? 'Try adjusting your filters.' : 'Submit a startup idea to see results here.'}
          </p>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {(analyses ?? []).map((analysis: AnalysisRecord, index: number) => {
            const isExpanded = expandedId === analysis?.id;
            return (
              <motion.div
                key={analysis?.id ?? index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div
                  className="rounded-xl bg-card border border-border/50 overflow-hidden hover:shadow-md transition-shadow"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : (analysis?.id ?? null))}
                      className="flex-1 flex items-center gap-4 text-left"
                    >
                      <div className={`font-mono text-xl font-bold flex-shrink-0 w-10 text-center ${getScoreColor(analysis?.score ?? 0)}`}>
                        {analysis?.score ?? 0}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {analysis?.idea ?? 'Unknown idea'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getVerdictStyle(analysis?.verdict ?? '')}`}>
                            {analysis?.verdict ?? 'N/A'}
                          </span>
                          <span className="text-xs text-muted-foreground">{analysis?.confidence}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {analysis?.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>

                    <Link
                      href={`/analysis/${analysis.id}`}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                      title="Open full report"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>

                  <AnimatePresence>
                    {isExpanded && analysis?.result && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-border/30 pt-5">
                          <AnalysisDashboard result={analysis.result} analysisId={analysis.id} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
