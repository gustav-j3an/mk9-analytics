'use client';

import React from 'react';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-[#25231F]/70 backdrop-blur-xs transition-opacity" onClick={onCancel} />

      {/* Modal Card */}
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="mk-dialog relative z-10 w-full max-w-md space-y-4 rounded-2xl border p-6 animate-scaleUp">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${danger ? 'bg-[color-mix(in_srgb,var(--mk-danger)_14%,transparent)] text-[var(--mk-danger)]' : 'bg-[color-mix(in_srgb,var(--mk-success)_14%,transparent)] text-[var(--mk-success)]'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 id="confirm-dialog-title" className="text-base font-bold text-[var(--mk-text)]">{title}</h4>
            <p className="text-xs leading-5 text-[var(--mk-text-secondary)]">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
