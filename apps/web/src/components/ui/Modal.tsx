'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
  theme?: 'light' | 'dark';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  theme = 'light',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Body */}
      <div
        role="dialog"
        aria-modal="true"
        className={twMerge(
          clsx(
            'relative rounded-3xl shadow-2xl w-full p-6 md:p-8 z-10 animate-scale-up overflow-hidden max-h-[90vh] flex flex-col',
            isDark
              ? 'bg-[#040f26]/98 text-white border-2 border-[#126BFF]/60 shadow-[0_0_40px_rgba(18,107,255,0.35)]'
              : 'bg-white rounded-3xl shadow-2xl border border-admin-border text-admin-text',
            maxWidths[maxWidth]
          )
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={twMerge(
              clsx(
                'flex items-start justify-between pb-4 mb-4 shrink-0',
                isDark ? 'border-b border-[#126BFF]/30' : 'border-b border-admin-border/60'
              )
            )}
          >
            <div>
              {title && (
                <h3
                  className={twMerge(
                    clsx(
                      'text-lg md:text-xl font-black tracking-tight',
                      isDark ? 'text-white' : 'text-admin-text'
                    )
                  )}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className={twMerge(
                    clsx('text-xs mt-1 leading-relaxed', isDark ? 'text-slate-300' : 'text-admin-muted')
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={twMerge(
                  clsx(
                    'p-2 rounded-xl transition-colors shrink-0',
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-blue-500/40'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                  )
                )}
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
}
