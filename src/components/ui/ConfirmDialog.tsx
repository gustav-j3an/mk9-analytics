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
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity" onClick={onCancel} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 z-10 space-y-4 animate-scaleUp">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${danger ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
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
