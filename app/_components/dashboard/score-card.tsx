'use client';

import { useEffect, useState } from 'react';
import { Award, TrendingUp, TrendingDown, Minus, Activity, BarChart3, Info, MessageSquareQuote } from 'lucide-react';

function getVerdictStyle(verdict: string) {
  const v = verdict?.toLowerCase?.() ?? '';
  if (v === 'build') return { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' };
  if (v === 'pivot') return { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' };
  return { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' };
}

function getVerdictIcon(verdict: string) {
  const v = verdict?.toLowerCase?.() ?? '';
  if (v === 'build') return TrendingUp;
  if (v === 'pivot') return Minus;
  return TrendingDown;
}

function getScoreColor(score: number) {
  if (score >= 7) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 4) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreRingColor(score: number) {
  if (score >= 7) return 'stroke-emerald-500';
  if (score >= 4) return 'stroke-amber-500';
  return 'stroke-red-500';
}

function getLevelBadge(level: string) {
  const l = level?.toLowerCase?.() ?? '';
  if (l === 'high') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (l === 'medium') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  return 'bg-red-500/10 text-red-600 dark:text-red-400';
}

export function ScoreCard({
  score, confidence, confidenceReasoning, verdict, verdictReasoning, demandLevel, marketSaturation
}: {
  score: number;
  confidence: string;
  confidenceReasoning?: string;
  verdict: string;
  verdictReasoning?: string;
  demandLevel?: string;
  marketSaturation?: string;
}) {
  const [displayScore, setDisplayScore] = useState(0);
  const safeScore = Math.min(Math.max(score ?? 0, 0), 10);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1200;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayScore(Math.round(progress * safeScore * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [safeScore]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (circumference * (displayScore / 10));
  const verdictStyle = getVerdictStyle(verdict);
  const VerdictIcon = getVerdictIcon(verdict);

  return (
    <div className="rounded-xl bg-card border border-border/50 p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" className="-rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" className="stroke-muted" />
            <circle
              cx="50" cy="50" r="40" fill="none" strokeWidth="6"
              strokeLinecap="round"
              className={getScoreRingColor(safeScore)}
              style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1.2s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-2xl font-bold ${getScoreColor(safeScore)}`}>
              {displayScore?.toFixed?.(1) ?? '0.0'}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 10</span>
          </div>
        </div>

        {/* Verdict + Badges */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${verdictStyle.bg} ${verdictStyle.border}`}>
              <VerdictIcon className={`h-5 w-5 ${verdictStyle.text}`} />
              <span className={`font-display text-lg font-bold ${verdictStyle.text}`}>
                {verdict ?? 'Unknown'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {confidence ?? 'Unknown'} Confidence
              </span>
            </div>

            {demandLevel && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelBadge(demandLevel)}`}>
                <Activity className="h-3 w-3" />
                {demandLevel} Demand
              </div>
            )}

            {marketSaturation && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelBadge(marketSaturation === 'Low' ? 'High' : marketSaturation === 'High' ? 'Low' : 'Medium')}`}>
                <BarChart3 className="h-3 w-3" />
                {marketSaturation} Saturation
              </div>
            )}
          </div>

          {/* Verdict Reasoning */}
          {verdictReasoning && (
            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg ${verdictStyle.bg}`}>
              <MessageSquareQuote className={`h-4 w-4 mt-0.5 flex-shrink-0 ${verdictStyle.text}`} />
              <p className={`text-sm leading-relaxed font-medium ${verdictStyle.text}`}>
                {verdictReasoning}
              </p>
            </div>
          )}

          {/* Confidence Reasoning */}
          {confidenceReasoning && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/50">
              <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                {confidenceReasoning}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
