import React from 'react';
import type { ImportItem } from '@/modules/imports/dashboard/imports-dashboard.types';
import { ImportStatusBadge } from './ImportStatusBadge';

interface ImportsTableProps {
  imports: ImportItem[];
}

export const ImportsTable = ({ imports }: ImportsTableProps) => {
  if (imports.length === 0) {
    return (
      <div className="bg-white border border-[#F4F4F5] rounded-2xl p-12 text-center shadow-xs">
        <p className="text-gray-500 font-semibold text-xs">Nenhuma importação realizada até o momento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#F4F4F5] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#F4F4F5]">
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Data</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Arquivo</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-right">Total</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-right">Válidas</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-right">Inválidas</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider text-right">Duplicadas</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Confirmada Em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5]">
            {imports.map((item) => (
              <tr key={item.id} className="hover:bg-[#FAFAFA] transition-colors duration-150">
                <td className="px-5 py-4 text-xs font-semibold text-[#3F3F46] whitespace-nowrap">{item.createdAt}</td>
                <td className="px-5 py-4 text-xs font-bold text-[#09090B] font-mono whitespace-nowrap">{item.nomeArquivo}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <ImportStatusBadge status={item.status} />
                </td>
                <td className="px-5 py-4 text-xs font-bold text-[#09090B] text-right whitespace-nowrap font-mono tabular-nums">
                  {item.totalRows}
                </td>
                <td className="px-5 py-4 text-xs font-bold text-[#16A34A] text-right whitespace-nowrap font-mono tabular-nums">
                  {item.validRows}
                </td>
                <td className="px-5 py-4 text-xs font-bold text-[#EF4444] text-right whitespace-nowrap font-mono tabular-nums">
                  {item.invalidRows}
                </td>
                <td className="px-5 py-4 text-xs font-bold text-[#D97706] text-right whitespace-nowrap font-mono tabular-nums">
                  {item.duplicateRows}
                </td>
                <td className="px-5 py-4 text-xs font-semibold text-[#71717A] whitespace-nowrap">
                  {item.confirmedAt || <span className="text-[#D4D4D8]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImportsTable;
