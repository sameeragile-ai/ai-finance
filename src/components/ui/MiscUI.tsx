import React, { useEffect, useState } from 'react';

// BADGE
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'sky';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80',
  };

  const dotColors = {
    teal: 'bg-teal-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
    sky: 'bg-sky-500',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 leading-normal',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

// CARD
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverLift = false,
  padded = true,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 transition-all duration-200 ${
        hoverLift ? 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5' : ''
      } ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// EMPTY STATE
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 border border-slate-200">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

// SKELETON
export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
};

// COUNTER (Counting animation for KPI numbers)
export const Counter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
}> = ({ value, prefix = '', suffix = '', decimals = 0, durationMs = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const startVal = 0;
    const endVal = value;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = startVal + (endVal - startVal) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, durationMs]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString('en-AU');

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
