'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, LogOut, CheckCircle2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  iconType?: 'logout' | 'alert' | 'info' | 'success';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  iconType = 'alert',
  isLoading = false,
}: ConfirmDialogProps) {
  const icons = {
    logout: <LogOut className="w-6 h-6 text-red-600" />,
    alert: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    info: <Info className="w-6 h-6 text-brand-500" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
  };

  const iconBgs = {
    logout: 'bg-red-50 border-red-100',
    alert: 'bg-amber-50 border-amber-100',
    info: 'bg-brand-50 border-brand-100',
    success: 'bg-emerald-50 border-emerald-100',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center p-2">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${iconBgs[iconType]}`}
        >
          {icons[iconType]}
        </div>

        <h3 className="text-lg font-black text-admin-text tracking-tight">{title}</h3>
        <p className="text-xs text-admin-muted mt-2 leading-relaxed max-w-xs">{description}</p>

        <div className="flex items-center gap-3 w-full mt-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            isLoading={isLoading}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
