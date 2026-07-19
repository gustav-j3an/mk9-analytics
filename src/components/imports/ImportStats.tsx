import React from 'react';
import type { ImportsStatsData } from '@/modules/imports/dashboard/imports-dashboard.types';
import { Database, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface ImportStatsProps {
  stats: ImportsStatsData;
}

export const ImportStats = ({ stats }: ImportStatsProps) => {
  return (
    <div className="bg-white border border-[#F4F4F5] rounded-2xl divide-y md:divide-y-0 md:divide-x divide-[#F4F4F5] grid grid-cols-2 lg:grid-cols-4 shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)] mb-8">
      
      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Total Importações</p>
          <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{stats.totalImports}</p>
        </div>
        <Database className="w-5 h-5 text-[#A1A1AA]" />
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Confirmadas</p>
          <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{stats.confirmedCount}</p>
        </div>
        <CheckCircle className="w-5 h-5 text-[#16A34A] opacity-75" />
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Pendentes</p>
          <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{stats.pendingCount}</p>
        </div>
        <Clock className="w-5 h-5 text-[#A1A1AA]" />
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Com Erro</p>
          <p className={`text-2xl font-black tracking-tight tabular-nums ${stats.failedCount > 0 ? 'text-[#EF4444]' : 'text-[#09090B]'}`}>{stats.failedCount}</p>
        </div>
        <AlertTriangle className={`w-5 h-5 ${stats.failedCount > 0 ? 'text-[#EF4444] opacity-75' : 'text-[#A1A1AA]'}`} />
      </div>

    </div>
  );
};

export default ImportStats;
