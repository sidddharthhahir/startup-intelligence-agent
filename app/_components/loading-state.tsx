'use client';

import { Brain, Search, BarChart3, Lightbulb, Target, Rocket, Layers, Megaphone, Globe, Palette } from 'lucide-react';
import { useEffect, useState } from 'react';

const STEP1_MESSAGES = [
  { icon: Search, label: 'Running deep market research...' },
  { icon: BarChart3, label: 'Mapping competitive landscape...' },
  { icon: Brain, label: 'Applying 5-lens due diligence...' },
  { icon: Lightbulb, label: 'Scoring idea & forming verdict...' },
];

const STEP2_MESSAGES = [
  { icon: Layers, label: 'Designing lean MVP architecture...' },
  { icon: Target, label: 'Planning monetization & unit economics...' },
  { icon: Megaphone, label: 'Building go-to-market playbook...' },
  { icon: Rocket, label: 'Crafting pitch & landing page copy...' },
];

const STEP3_MESSAGES = [
  { icon: Palette, label: 'Designing your sample landing page...' },
  { icon: Globe, label: 'Generating production-quality HTML...' },
];

const ALL_STEPS = [STEP1_MESSAGES, STEP2_MESSAGES, STEP3_MESSAGES];
const STEP_TITLES = ['Research & Due Diligence', 'Execution Planning', 'Sample Landing Page'];

export function LoadingState({ step, idea, totalSteps = 3 }: { step: number; idea: string; totalSteps?: number }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const safeStep = Math.min(Math.max(step, 1), 3);
  const messages = ALL_STEPS[safeStep - 1] ?? ALL_STEPS[0];

  useEffect(() => {
    setMsgIndex(0);
  }, [safeStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev: number) => {
        if (prev < (messages?.length ?? 1) - 1) return prev + 1;
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [messages]);

  const current = messages?.[msgIndex] ?? messages?.[0];
  const StepIcon = current?.icon ?? Brain;

  const stepProgress = ((safeStep - 1) / totalSteps) * 100;
  const withinStep = (msgIndex / Math.max(messages.length, 1)) * (100 / totalSteps);
  const progress = Math.min(stepProgress + withinStep, 95);

  return (
    <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
          <StepIcon className="h-10 w-10 text-primary" />
        </div>
      </div>

      <h2 className="font-display text-xl font-bold tracking-tight mb-1 text-center">
        {STEP_TITLES[safeStep - 1] ?? 'Processing'}
      </h2>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i + 1 < safeStep
                ? 'bg-primary text-primary-foreground'
                : i + 1 === safeStep
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1 < safeStep ? '\u2713' : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-8 h-0.5 ${i + 1 < safeStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-6 text-center line-clamp-2">
        {idea?.slice(0, 120)}{(idea?.length ?? 0) > 120 ? '...' : ''}
      </p>

      <div className="w-full bg-muted rounded-full h-2 mb-3">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(progress ?? 0, 95)}%` }}
        />
      </div>

      <p className="text-sm text-primary font-medium">
        {current?.label ?? 'Processing...'}
      </p>
    </div>
  );
}
