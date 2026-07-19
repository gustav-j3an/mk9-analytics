import React from 'react';
import type { VisitsSummaryData } from '@/modules/visits/dashboard/visits-dashboard.types';
import { Calendar, CheckCircle2, Clock, AlertCircle, Percent, Trophy, BarChart3 } from 'lucide-react';

interface VisitsSummaryProps {
  summary: VisitsSummaryData;
}

export const VisitsSummary = ({ summary }: VisitsSummaryProps) => {
  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="bg-white border border-[#F4F4F5] rounded-2xl divide-y md:divide-y-0 md:divide-x divide-[#F4F4F5] grid grid-cols-2 lg:grid-cols-5 shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)] animate-fadeIn">
        
        <div className="p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Planejadas</p>
            <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{summary.totalPlanned}</p>
          </div>
          <Calendar className="w-5 h-5 text-[#A1A1AA]" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Executadas</p>
            <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{summary.totalExecuted}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] opacity-75" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Pendentes</p>
            <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{summary.totalPending}</p>
          </div>
          <Clock className="w-5 h-5 text-[#3B82F6] opacity-75" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Atrasadas</p>
            <p className={`text-2xl font-black tracking-tight tabular-nums ${summary.totalOverdue > 0 ? 'text-[#EF4444]' : 'text-[#09090B]'}`}>{summary.totalOverdue}</p>
          </div>
          <AlertCircle className={`w-5 h-5 ${summary.totalOverdue > 0 ? 'text-[#EF4444] opacity-75' : 'text-[#A1A1AA]'}`} />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Cobertura</p>
            <p className="text-2xl font-black text-[#09090B] tracking-tight tabular-nums">{summary.coverage}%</p>
          </div>
          <Percent className="w-5 h-5 text-[#A1A1AA]" />
        </div>

      </div>

      {/* Rankings/Completion Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Promoters Completion */}
        <div className="bg-white border border-[#F4F4F5] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)]">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-[#71717A]" />
            <h3 className="font-bold text-[#09090B] text-xs uppercase tracking-wider">Conclusão por Promotor</h3>
          </div>
          {summary.promoterCompletionRates.length === 0 ? (
            <p className="text-[10px] text-[#A1A1AA] font-semibold py-2">Nenhum promotor listado.</p>
          ) : (
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {summary.promoterCompletionRates.slice(0, 5).map((item) => (
                <div key={item.promoterName} className="flex items-center justify-between text-xs">
                  <span className="text-[#3F3F46] font-semibold">{item.promoterName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 bg-[#F4F4F5] rounded-full h-1 overflow-hidden">
                      <div className="bg-[#09090B] h-1 rounded-full" style={{ width: `${item.rate}%` }} />
                    </div>
                    <span className="font-mono font-bold text-[#09090B] w-8 text-right tabular-nums">{item.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operations Completion */}
        <div className="bg-white border border-[#F4F4F5] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#71717A]" />
            <h3 className="font-bold text-[#09090B] text-xs uppercase tracking-wider">Conclusão por Operação</h3>
          </div>
          {summary.operationCompletionRates.length === 0 ? (
            <p className="text-[10px] text-[#A1A1AA] font-semibold py-2">Nenhuma operação listada.</p>
          ) : (
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {summary.operationCompletionRates.slice(0, 5).map((item) => (
                <div key={item.operationName} className="flex items-center justify-between text-xs">
                  <span className="text-[#3F3F46] font-semibold">{item.operationName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 bg-[#F4F4F5] rounded-full h-1 overflow-hidden">
                      <div className="bg-[#09090B] h-1 rounded-full" style={{ width: `${item.rate}%` }} />
                    </div>
                    <span className="font-mono font-bold text-[#09090B] w-8 text-right tabular-nums">{item.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitsSummary;
