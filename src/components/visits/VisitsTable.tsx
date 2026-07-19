import React from 'react';
import type { VisitItem } from '@/modules/visits/dashboard/visits-dashboard.types';
import { VisitStatusBadge } from './VisitStatusBadge';
import { Image as ImageIcon, ClipboardCheck } from 'lucide-react';

interface VisitsTableProps {
  visits: VisitItem[];
}

export const VisitsTable = ({ visits }: VisitsTableProps) => {
  if (visits.length === 0) {
    return (
      <div className="bg-white border border-[#F4F4F5] rounded-2xl p-12 text-center shadow-xs">
        <p className="text-gray-500 font-semibold text-xs">Nenhuma visita encontrada com os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#F4F4F5] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#F4F4F5]">
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Data Planejada</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Promotor</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Loja</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Indústria</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Operação</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Foto</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Checklist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5]">
            {visits.map((item) => (
              <tr key={item.id} className="hover:bg-[#FAFAFA] transition-colors duration-150">
                <td className="px-5 py-4 text-xs font-bold text-[#09090B] font-mono whitespace-nowrap">{item.scheduledDate}</td>
                <td className="px-5 py-4 text-xs font-bold text-[#3F3F46] whitespace-nowrap">{item.promoterName}</td>
                <td className="px-5 py-4 text-xs font-semibold text-[#71717A] whitespace-nowrap">{item.storeName}</td>
                <td className="px-5 py-4 text-xs font-semibold text-[#71717A] whitespace-nowrap">{item.industryName}</td>
                <td className="px-5 py-4 text-xs font-semibold text-[#71717A] whitespace-nowrap">{item.operationName}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <VisitStatusBadge status={item.status} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-xs font-semibold text-[#71717A]">
                  {item.fotoUrl ? (
                    <span className="inline-flex items-center gap-1 text-[#3B82F6] font-bold hover:underline cursor-pointer">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Visualizar
                    </span>
                  ) : (
                    <span className="text-[#D4D4D8]">—</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-xs font-semibold text-[#71717A]">
                  {item.status === 'REALIZADA' ? (
                    <span className="inline-flex items-center gap-1 text-[#16A34A] font-bold">
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      {item.checklistStatus}
                    </span>
                  ) : (
                    <span className="text-[#D4D4D8]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitsTable;
