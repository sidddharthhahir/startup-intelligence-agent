'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const VARIANT_STYLES: Record<string, string> = {
  default: 'border-border/50',
  success: 'border-emerald-500/20',
  warning: 'border-amber-500/20',
  destructive: 'border-red-500/20',
  info: 'border-blue-500/20',
};

const ICON_STYLES: Record<string, string> = {
  default: 'text-primary bg-primary/10',
  success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  destructive: 'text-red-600 dark:text-red-400 bg-red-500/10',
  info: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
};

export function SectionCard({
  title,
  icon: Icon,
  variant = 'default',
  children
}: {
  title: string;
  icon: LucideIcon;
  variant?: string;
  children: ReactNode;
}) {
  const borderClass = VARIANT_STYLES?.[variant] ?? VARIANT_STYLES.default;
  const iconClass = ICON_STYLES?.[variant] ?? ICON_STYLES.default;

  return (
    <div
      className={`rounded-xl bg-card border ${borderClass} p-5 h-full hover:shadow-lg transition-shadow duration-200`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`p-1.5 rounded-lg ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
