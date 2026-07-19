import React from 'react';
import type { ImportStatus } from '@/modules/imports/dashboard/imports-dashboard.types';

interface ImportStatusBadgeProps {
  status: ImportStatus;
}

export const ImportStatusBadge = ({ status }: ImportStatusBadgeProps) => {
  const styles: Record<ImportStatus, { bg: string; border: string; text: string; label: string }> = {
    SUCCESS: {
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#DCFCE7]',
      text: 'text-[#16A34A]',
      label: 'Sucesso',
    },
    FAILED: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FEE2E2]',
      text: 'text-[#EF4444]',
      label: 'Falha',
    },
    PENDING: {
      bg: 'bg-[#FFFBEB]',
      border: 'border-[#FEF3C7]',
      text: 'text-[#D97706]',
      label: 'Pendente',
    },
    EXPIRED: {
      bg: 'bg-[#F4F4F5]',
      border: 'border-[#E4E4E7]',
      text: 'text-[#71717A]',
      label: 'Expirado',
    },
    CONFIRMED: {
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#DBEAFE]',
      text: 'text-[#3B82F6]',
      label: 'Confirmado',
    },
  };

  const current = styles[status] || styles.PENDING;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${current.bg} ${current.border} ${current.text}`}>
      {current.label}
    </span>
  );
};

export default ImportStatusBadge;
