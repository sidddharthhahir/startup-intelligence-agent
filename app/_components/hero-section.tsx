'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from './header';
import { IdeaForm } from './idea-form';
import { AnalysisDashboard } from './analysis-dashboard';
import { LoadingState } from './loading-state';
import type { AnalysisResult } from '@/lib/analysis-types';
import { Lightbulb, RotateCcw, PenLine, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HeroSection() {
  const [state, setState] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loadingStep, setLoadingStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(3);
  const [currentIdea, setCurrentIdea] = useState('');
  const [prefillIdea, setPrefillIdea] = useState('');
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sia_daily_analyses');
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = new Date().toISOString().slice(0, 10);
        if (parsed?.date === today) {
          setDailyCount(parsed.count ?? 0);
        } else {
          localStorage.setItem('sia_daily_analyses', JSON.stringify({ date: today, count: 0 }));
        }
      }
    } catch {}
  }, []);

  const handleSubmit = useCallback(async (idea: string) => {
    setState('loading');
    setLoadingStep(1);
    setTotalSteps(3);
    setError('');
    setResult(null);
    setAnalysisId(null);
    setCurrentIdea(idea);

    // Increment daily counter
    try {
      const today = new Date().toISOString().slice(0, 10);
      const stored = localStorage.getItem('sia_daily_analyses');
      const parsed = stored ? JSON.parse(stored) : null;
      const newCount = (parsed?.date === today ? (parsed.count ?? 0) : 0) + 1;
      localStorage.setItem('sia_daily_analyses', JSON.stringify({ date: today, count: newCount }));
      setDailyCount(newCount);
    } catch {}

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ message: 'Analysis request failed' }));
        throw new Error(errBody?.message ?? 'Analysis request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let partialRead = '';
      let receivedResult = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === 'processing') {
                setLoadingStep(parsed?.step ?? 1);
                if (parsed?.totalSteps) setTotalSteps(parsed.totalSteps);
              } else if (parsed?.status === 'step_complete') {
                const nextStep = (parsed?.step ?? 0) + 1;
                setLoadingStep(nextStep);
              } else if (parsed?.status === 'completed') {
                receivedResult = true;
                setResult(parsed?.result ?? null);
                if (parsed?.analysisId) {
                  setAnalysisId(parsed.analysisId);
                } else {
                  // Fallback: fetch latest
                  try {
                    const idRes = await fetch('/api/analyses?limit=1');
                    if (idRes.ok) {
                      const idData = await idRes.json();
                      if (idData?.[0]?.id) setAnalysisId(idData[0].id);
                    }
                  } catch {}
                }
                setState('completed');
                return;
              } else if (parsed?.status === 'error') {
                throw new Error(parsed?.message ?? 'Analysis failed');
              }
            } catch (e: any) {
              if (e?.message && !e.message.includes('JSON')) {
                throw e;
              }
            }
          }
        }
      }

      if (!receivedResult) {
        throw new Error('Analysis stream ended without results.');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err?.message ?? 'Something went wrong. Please try again.');
      setState('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setResult(null);
    setAnalysisId(null);
    setError('');
    setLoadingStep(1);
    setCurrentIdea('');
    setPrefillIdea('');
  }, []);

  const handleRefine = useCallback(() => {
    setPrefillIdea(currentIdea);
    setState('idle');
    setResult(null);
    setAnalysisId(null);
    setError('');
    setLoadingStep(1);
  }, [currentIdea]);

  return (
    <>
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-10 pt-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Lightbulb className="h-4 w-4" />
                  AI-Powered Startup Intelligence
                </div>
                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3">
                  Validate Your Startup <span className="text-primary">Idea</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  VC-grade due diligence, execution planning, and a ready-to-use landing page — all from a single prompt.
                </p>
                {dailyCount >= 10 && (
                  <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    You&apos;ve run {dailyCount} analyses today — each one uses LLM credits.
                  </div>
                )}
              </div>
              <IdeaForm onSubmit={handleSubmit} prefillIdea={prefillIdea} />
            </motion.div>
          )}

          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingState step={loadingStep} idea={currentIdea} totalSteps={totalSteps} />
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive max-w-md mx-auto mb-6">
                <p className="font-medium">{error || 'Something went wrong.'}</p>
              </div>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
            </motion.div>
          )}

          {state === 'completed' && result && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Analysis Results</h2>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                    {currentIdea?.slice(0, 100)}{(currentIdea?.length ?? 0) > 100 ? '...' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefine}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors text-sm"
                  >
                    <PenLine className="h-4 w-4" />
                    Refine Idea
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors text-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    New Analysis
                  </button>
                </div>
              </div>
              <AnalysisDashboard result={result} analysisId={analysisId ?? undefined} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
