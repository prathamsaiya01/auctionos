import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral' | 'live' | 'category' | 'purple' | 'info';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-bold tracking-tight rounded-full select-none';

  const variants = {
    primary: 'bg-brand-50 text-brand-700 border border-brand-200/80',
    secondary: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    danger: 'bg-red-50 text-red-700 border border-red-200/80',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
    live: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black',
    category: 'bg-purple-50 text-purple-700 border border-purple-200 font-extrabold uppercase',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 font-extrabold',
    info: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold',
  };

  const dotColors = {
    primary: 'bg-brand-500',
    secondary: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    neutral: 'bg-gray-400',
    live: 'bg-emerald-400 animate-pulse',
    category: 'bg-purple-500',
    purple: 'bg-purple-500',
    info: 'bg-blue-500',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} {...props}>
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
