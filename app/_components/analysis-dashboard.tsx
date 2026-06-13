'use client';

import type { AnalysisResult } from '@/lib/analysis-types';
import { ScoreCard } from './dashboard/score-card';
import { SectionCard } from './dashboard/section-card';
import { BulletList } from './dashboard/bullet-list';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Shield, AlertTriangle,
  Sparkles, Target, Megaphone, Layout, Mic,
  Globe, Layers, Workflow, Code2, Building2,
  DollarSign, CreditCard, Download, Loader2, Share2, Link2,
  ExternalLink, Users, BarChart3, Clock, Zap, MessageSquare,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay }
});

export function AnalysisDashboard({ result, analysisId, showActions = true }: { result: AnalysisResult; analysisId?: string; showActions?: boolean }) {
  const r = result ?? {} as AnalysisResult;
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [showSamplePage, setShowSamplePage] = useState(false);

  const handleExportPdf = async () => {
    if (!analysisId || exporting) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: analysisId })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'PDF export failed' }));
        throw new Error(errData?.error ?? 'PDF export failed');
      }
      const { html, error } = await res.json();
      if (error) throw new Error(error);
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Pop-up blocked — allow pop-ups for this site and try again.');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
      toast.success('Print dialog opened — choose "Save as PDF"');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!analysisId || copying) return;
    setCopying(true);
    try {
      const url = `${window.location.origin}/analysis/${analysisId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Shareable link copied!');
    } catch {
      toast.error('Failed to copy link');
    } finally {
      setTimeout(() => setCopying(false), 1500);
    }
  };

  const pitchObj = typeof r.pitchSummary === 'object' && r.pitchSummary !== null ? r.pitchSummary : null;
  const hasSamplePage = !!r.samplePageHtml && !!analysisId;

  return (
    <div className="space-y-6 pb-12">
      {/* Action buttons */}
      {showActions && analysisId && (
        <motion.div {...fadeIn(0)} className="flex flex-wrap gap-2 justify-end">
          {hasSamplePage && (
            <button
              onClick={() => setShowSamplePage(!showSamplePage)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {showSamplePage ? 'Hide Sample Page' : 'View Sample Page'}
            </button>
          )}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
          >
            {copying ? <Link2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {copying ? 'Copied!' : 'Share Link'}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {exporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </motion.div>
      )}

      {/* Sample Page Preview */}
      {showSamplePage && hasSamplePage && (
        <motion.div {...fadeIn(0)}>
          <div className="rounded-xl border border-emerald-500/30 overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 ml-2">
                  Your Sample Landing Page
                </span>
              </div>
              <a
                href={`/api/sample/${analysisId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <iframe
              src={`/api/sample/${analysisId}`}
              className="w-full border-0"
              style={{ height: '700px' }}
              title="Sample Landing Page Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </motion.div>
      )}

      {/* Top row: Score + Verdict */}
      <motion.div {...fadeIn(0)}>
        <ScoreCard
          score={r?.ideaScore ?? 0}
          confidence={r?.confidence ?? 'Unknown'}
          confidenceReasoning={r?.confidenceReasoning}
          verdict={r?.verdict ?? 'Unknown'}
          verdictReasoning={r?.verdictReasoning}
          demandLevel={r?.demandLevel}
          marketSaturation={r?.marketSaturation}
        />
      </motion.div>

      {/* Research Summary */}
      <motion.div {...fadeIn(0.05)}>
        <SectionCard title="Market Research" icon={Globe}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Market Size</p>
              <p className="text-sm text-foreground">{r?.researchSummary?.marketSize ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Target Audience</p>
              <p className="text-sm text-foreground">{r?.researchSummary?.targetAudience ?? 'N/A'}</p>
            </div>
            {/* TAM/SAM/SOM */}
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Market Sizing</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'TAM', value: r?.researchSummary?.tam },
                  { label: 'SAM', value: r?.researchSummary?.sam },
                  { label: 'SOM', value: r?.researchSummary?.som },
                ].map((item, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] font-bold text-primary uppercase">{item.label}</p>
                    <p className="text-xs text-foreground mt-0.5">{item.value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Buyer Persona */}
            {r?.researchSummary?.buyerPersona && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="h-3 w-3" /> Ideal First Customer</p>
                <p className="text-sm text-foreground italic">{r.researchSummary.buyerPersona}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Key Trends</p>
              <BulletList items={r?.researchSummary?.trends ?? []} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Competitors</p>
              <BulletList items={r?.researchSummary?.competitors ?? []} />
            </div>
            {/* Competitor Weaknesses */}
            {(r?.researchSummary?.competitorWeaknesses ?? []).length > 0 && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Competitor Weaknesses to Exploit</p>
                <BulletList items={r.researchSummary.competitorWeaknesses} />
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* SWOT-style row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div {...fadeIn(0.1)}>
          <SectionCard title="Strengths" icon={TrendingUp} variant="success">
            <BulletList items={r?.strengths ?? []} />
          </SectionCard>
        </motion.div>
        <motion.div {...fadeIn(0.15)}>
          <SectionCard title="Weaknesses" icon={TrendingDown} variant="warning">
            <BulletList items={r?.weaknesses ?? []} />
          </SectionCard>
        </motion.div>
        <motion.div {...fadeIn(0.2)}>
          <SectionCard title="Differentiation" icon={Sparkles} variant="info">
            <BulletList items={r?.differentiation ?? []} />
          </SectionCard>
        </motion.div>
      </div>

      {/* Risks & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div {...fadeIn(0.25)}>
          <SectionCard title="Risks" icon={AlertTriangle} variant="destructive">
            <BulletList items={r?.risks ?? []} />
          </SectionCard>
        </motion.div>
        <motion.div {...fadeIn(0.3)}>
          <SectionCard title="Opportunities" icon={Shield} variant="success">
            <BulletList items={r?.opportunities ?? []} />
          </SectionCard>
        </motion.div>
      </div>

      {/* MVP Plan */}
      <motion.div {...fadeIn(0.35)}>
        <SectionCard title="MVP Plan" icon={Layers}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Target className="h-3 w-3" /> Core Features
              </p>
              <BulletList items={r?.mvpPlan?.coreFeatures ?? []} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Workflow className="h-3 w-3" /> User Flow
              </p>
              <BulletList items={r?.mvpPlan?.userFlow ?? []} ordered />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Code2 className="h-3 w-3" /> Tech Stack
              </p>
              <BulletList items={r?.mvpPlan?.techStack ?? []} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Architecture
                </p>
                <p className="text-sm text-foreground">{r?.mvpPlan?.architecture ?? 'N/A'}</p>
              </div>
              {r?.mvpPlan?.buildTimeline && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Build Timeline
                  </p>
                  <p className="text-sm text-foreground">{r.mvpPlan.buildTimeline}</p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Monetization */}
      <motion.div {...fadeIn(0.38)}>
        <SectionCard title="Monetization Strategy" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Model</p>
              <p className="text-sm text-foreground font-medium">{r?.monetization?.model ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Revenue Streams</p>
              <BulletList items={r?.monetization?.revenueStreams ?? []} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Pricing Tiers
              </p>
              <BulletList items={r?.monetization?.pricingTiers ?? []} />
            </div>
            {r?.monetization?.unitEconomics && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Unit Economics
                </p>
                <p className="text-sm text-foreground">{r.monetization.unitEconomics}</p>
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Go-To-Market */}
      <motion.div {...fadeIn(0.4)}>
        <SectionCard title="Go-To-Market Strategy" icon={Megaphone}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Channels</p>
              <BulletList items={r?.goToMarket?.channels ?? []} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Strategy</p>
              <p className="text-sm text-foreground">{r?.goToMarket?.strategy ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Timeline
              </p>
              <p className="text-sm text-foreground">{r?.goToMarket?.timeline ?? 'N/A'}</p>
            </div>
            {r?.goToMarket?.firstHundredUsers && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3" /> First 100 Users Plan
                </p>
                <p className="text-sm text-foreground">{r.goToMarket.firstHundredUsers}</p>
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Landing Page Content */}
      <motion.div {...fadeIn(0.45)}>
        <SectionCard title="Landing Page Content" icon={Layout}>
          <div className="rounded-lg bg-muted/40 p-5 space-y-3">
            <h3 className="font-display text-xl font-bold tracking-tight">
              {r?.landingPageContent?.headline ?? 'N/A'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {r?.landingPageContent?.subheadline ?? ''}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {(r?.landingPageContent?.valueProps ?? []).map((vp: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {vp}
                </span>
              ))}
            </div>
            {r?.landingPageContent?.socialProof && (
              <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {r.landingPageContent.socialProof}
              </p>
            )}
            <div className="pt-2">
              <span className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                {r?.landingPageContent?.cta ?? 'Get Started'}
              </span>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Pitch Summary - Structured */}
      <motion.div {...fadeIn(0.5)}>
        <SectionCard title="Pitch Summary" icon={Mic}>
          {pitchObj ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Problem', value: pitchObj.problem },
                { label: 'Solution', value: pitchObj.solution },
                { label: 'Market', value: pitchObj.market },
                { label: 'Product', value: pitchObj.product },
                { label: 'Business Model', value: pitchObj.businessModel },
                { label: 'Unique Advantage', value: pitchObj.uniqueAdvantage },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm text-foreground leading-relaxed">{item.value || 'N/A'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">
              {typeof r.pitchSummary === 'string' ? r.pitchSummary : 'N/A'}
            </p>
          )}
        </SectionCard>
      </motion.div>

      {/* Reasoning Basis (backward-compat: also reads old evidenceSources) */}
      {((r?.reasoningBasis ?? (r as any)?.evidenceSources) ?? []).length > 0 && (
        <motion.div {...fadeIn(0.55)}>
          <SectionCard title="Reasoning Basis" icon={BookOpen}>
            <p className="text-xs text-muted-foreground mb-3">
              Key reasoning and data points underpinning this analysis:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {((r?.reasoningBasis ?? (r as any)?.evidenceSources) ?? []).map((source: string, i: number) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/40">
                  <span className="text-primary font-mono text-xs font-bold mt-0.5">[{i + 1}]</span>
                  <span className="text-sm text-foreground leading-relaxed">{source}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      )}
    </div>
  );
}
