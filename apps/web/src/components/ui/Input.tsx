import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, hint, ...props }, ref) => {
    const renderIcon = () => {
      if (!icon) return null;
      if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon)) {
        const IconComponent = icon as React.ComponentType<{ className?: string }>;
        return <IconComponent className="w-4 h-4" />;
      }
      return icon as React.ReactNode;
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-bold text-gray-700 tracking-tight">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {renderIcon()}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                'w-full px-4 py-2.5 bg-gray-50/80 border border-admin-border rounded-xl text-sm font-medium text-admin-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:bg-white transition-all',
                icon && 'pl-10',
                error && 'border-red-400 focus:ring-red-400/40 focus:border-red-500 bg-red-50/30',
                className
              )
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-[11px] text-gray-400">{hint}</p>}
        {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Select } from './Select';
