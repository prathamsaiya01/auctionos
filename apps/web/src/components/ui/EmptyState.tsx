import React from 'react';
import { Button } from './Button';
import { Layers } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return <Layers className="w-8 h-8" />;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon)) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-8 h-8" />;
    }
    return icon as React.ReactNode;
  };

  return (
    <div className={`bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 border border-brand-100">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-black text-admin-text tracking-tight">{title}</h3>
      <p className="text-xs text-admin-muted mt-1.5 max-w-sm leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-admin-border p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded-md w-24" />
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-8 bg-gray-200 rounded-md w-36 mt-3" />
      <div className="h-3 bg-gray-100 rounded-md w-48" />
    </div>
  );
}
