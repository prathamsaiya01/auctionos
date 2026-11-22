import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({ className, hoverEffect = false, children, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-admin-surface rounded-2xl border border-admin-border shadow-xs p-6',
          hoverEffect && 'hover:shadow-premium hover:border-brand-200/80 transition-all duration-200',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorTheme?: 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

export function MetricCard({
  label,
  title,
  value,
  subtitle,
  icon,
  iconColor,
  iconBg,
  trend,
  colorTheme = 'violet',
  className,
}: MetricCardProps) {
  const displayLabel = title || label || '';

  const themes = {
    violet: 'bg-brand-50 text-brand-600 border-brand-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon)) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className={clsx('w-5 h-5', iconColor)} />;
    }
    return icon as React.ReactNode;
  };

  return (
    <div
      className={twMerge(
        'bg-white rounded-2xl border border-admin-border p-5 shadow-xs hover:shadow-subtle transition-all duration-200 flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-admin-muted">{displayLabel}</span>
        <div
          className={twMerge(
            clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0',
              iconBg || themes[colorTheme]
            )
          )}
        >
          {renderIcon()}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-2xl md:text-3xl font-black text-admin-text tracking-tight tabular-nums">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={clsx(
                  'text-[10px] font-extrabold px-1.5 py-0.5 rounded-md',
                  trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {subtitle && <span className="text-xs text-admin-muted font-medium">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
