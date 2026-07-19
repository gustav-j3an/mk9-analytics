import React from 'react';
import type { OperationItem } from '@/modules/operations/dashboard/operations-dashboard.types';
import type { OperationStatus } from '@prisma/client';

interface OperationsTableProps {
  operations: OperationItem[];
}

export const OperationsTable = ({ operations }: OperationsTableProps) => {
  const statusLabels: Record<OperationStatus, { bg: string; border: string; text: string; label: string }> = {
    PLANNING: { bg: 'bg-[#EFF6FF]', border: 'border-[#DBEAFE]', text: 'text-[#3B82F6]', label: 'Planejamento' },
    OPEN: { bg: 'bg-[#F0FDF4]', border: 'border-[#DCFCE7]', text: 'text-[#16A34A]', label: 'Aberta' },
    IN_PROGRESS: { bg: 'bg-[#FFFBEB]', border: 'border-[#FEF3C7]', text: 'text-[#D97706]', label: 'Em Andamento' },
    FINISHED: { bg: 'bg-[#F4F4F5]', border: 'border-[#E4E4E7]', text: 'text-[#71717A]', label: 'Finalizada' },
    CANCELLED: { bg: 'bg-[#FEF2F2]', border: 'border-[#FEE2E2]', text: 'text-[#EF4444]', label: 'Cancelada' },
    ARCHIVED: { bg: 'bg-[#F4F4F5]', border: 'border-[#E4E4E7]', text: 'text-[#71717A]', label: 'Arquivada' },
  };

  if (operations.length === 0) {
    return (
      <div className="bg-white border border-[#F4F4F5] rounded-2xl p-12 text-center shadow-xs">
        <p className="text-gray-500 font-semibold text-xs">Nenhuma operação encontrada com os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#F4F4F5] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#F4F4F5]">
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Operação</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Cliente</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-right">Lojas</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-right">Promotores</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-right">Planejadas</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-right">Executadas</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-center">Cobertura</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Última Atualização</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5]">
            {operations.map((op) => {
              const currentStatus = statusLabels[op.status] || {
                bg: 'bg-[#F4F4F5]',
                border: 'border-[#E4E4E7]',
                text: 'text-[#71717A]',
                label: String(op.status),
              };

              return (
                <tr key={op.id} className="hover:bg-[#FAFAFA] transition-colors duration-150">
                  <td className="px-5 py-4 text-xs font-bold text-[#09090B] whitespace-nowrap">{op.name}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-[#71717A] whitespace-nowrap">
                    {op.clientId || <span className="text-[#D4D4D8]">—</span>}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${currentStatus.bg} ${currentStatus.border} ${currentStatus.text}`}>
                      {currentStatus.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-[#3F3F46] text-right whitespace-nowrap font-mono tabular-nums">{op.storesCount}</td>
                  <td className="px-5 py-4 text-xs font-bold text-[#3F3F46] text-right whitespace-nowrap font-mono tabular-nums">{op.promotersCount}</td>
                  <td className="px-5 py-4 text-xs font-bold text-[#3F3F46] text-right whitespace-nowrap font-mono tabular-nums">{op.visitsPlannedCount}</td>
                  <td className="px-5 py-4 text-xs font-bold text-[#16A34A] text-right whitespace-nowrap font-mono tabular-nums">{op.visitsExecutedCount}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-[#09090B] font-mono tabular-nums">{op.coverage}%</span>
                      <div className="w-12 bg-[#F4F4F5] rounded-full h-1 overflow-hidden hidden sm:block">
                        <div
                          className="bg-[#09090B] h-1 rounded-full"
                          style={{ width: `${Math.min(op.coverage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-[#71717A] whitespace-nowrap">{op.updatedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OperationsTable;
