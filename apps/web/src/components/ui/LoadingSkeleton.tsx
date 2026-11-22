import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={twMerge('animate-pulse rounded-xl bg-slate-200/80', className)}
      {...props}
    />
  );
}

export function CardLoadingSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-admin-border/80 p-5 space-y-4 shadow-xs">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  );
}
