import React from 'react';
import type { OperationsStatsData } from '@/modules/operations/dashboard/operations-dashboard.types';
import { Activity, CheckCircle, Archive } from 'lucide-react';

interface OperationCardProps {
  stats: OperationsStatsData;
}

export const OperationCard = ({ stats }: OperationCardProps) => {
  return (
    <div className="bg-white border border-[#F4F4F5] rounded-2xl divide-y md:divide-y-0 md:divide-x divide-[#F4F4F5] grid grid-cols-1 md:grid-cols-3 shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)] mb-8">
      
      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Operações Ativas</p>
          <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{stats.activeCount}</p>
        </div>
        <Activity className="w-5 h-5 text-[#3B82F6] opacity-75" />
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Finalizadas</p>
          <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{stats.finishedCount}</p>
        </div>
        <CheckCircle className="w-5 h-5 text-[#16A34A] opacity-75" />
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Arquivadas / Canceladas</p>
          <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{stats.archivedCount}</p>
        </div>
        <Archive className="w-5 h-5 text-[#71717A] opacity-75" />
      </div>

    </div>
  );
};

export default OperationCard;
