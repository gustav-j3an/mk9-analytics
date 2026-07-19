import React from 'react';
import type { VisitStatus } from '@prisma/client';

interface VisitStatusBadgeProps {
  status: VisitStatus;
}

export const VisitStatusBadge = ({ status }: VisitStatusBadgeProps) => {
  const styles: Record<VisitStatus, { bg: string; border: string; text: string; label: string }> = {
    PLANEJADA: {
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#DBEAFE]',
      text: 'text-[#3B82F6]',
      label: 'Planejada',
    },
    REALIZADA: {
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#DCFCE7]',
      text: 'text-[#16A34A]',
      label: 'Realizada',
    },
    CANCELADA: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FEE2E2]',
      text: 'text-[#EF4444]',
      label: 'Cancelada',
    },
  };

  const current = styles[status] || {
    bg: 'bg-[#F4F4F5]',
    border: 'border-[#E4E4E7]',
    text: 'text-[#71717A]',
    label: String(status),
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${current.bg} ${current.border} ${current.text}`}>
      {current.label}
    </span>
  );
};

export default VisitStatusBadge;
