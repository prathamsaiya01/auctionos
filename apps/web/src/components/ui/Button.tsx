'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'dark' | 'auction-bid';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      children,
      ...props
    },
    ref
  ) => {
    const isBusy = isLoading || loading;

    const baseStyles =
      'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary:
        'bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white shadow-md shadow-brand-500/20 focus:ring-brand-500',
      secondary:
        'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 focus:ring-blue-400',
      outline:
        'bg-white hover:bg-gray-50 text-gray-700 border border-admin-border hover:border-gray-300 shadow-xs focus:ring-gray-300',
      ghost:
        'bg-transparent hover:bg-gray-100/70 text-gray-600 hover:text-gray-900 focus:ring-gray-200',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 focus:ring-red-500',
      success:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 focus:ring-emerald-500',
      dark:
        'bg-slate-900 hover:bg-black text-white shadow-md shadow-slate-900/30 focus:ring-slate-800',
      'auction-bid':
        'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white shadow-glow-purple focus:ring-purple-500 font-black',
    };

    const sizes = {
      xs: 'text-[11px] px-2.5 py-1.5 gap-1.5 rounded-lg',
      sm: 'text-xs px-3 py-2 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5 rounded-2xl',
      xl: 'text-lg px-8 py-4 gap-3 rounded-2xl',
    };

    const renderIcon = () => {
      if (!icon) return null;
      if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon)) {
        const IconComponent = icon as React.ComponentType<{ className?: string }>;
        return <IconComponent className="w-4 h-4 shrink-0" />;
      }
      return <span className="shrink-0">{icon as React.ReactNode}</span>;
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isBusy}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          icon && iconPosition === 'left' && renderIcon()
        )}
        <span>{children}</span>
        {!isBusy && icon && iconPosition === 'right' && renderIcon()}
      </button>
    );
  }
);

Button.displayName = 'Button';
