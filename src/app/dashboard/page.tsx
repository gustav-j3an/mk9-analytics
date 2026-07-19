import React from 'react';
import { prisma } from '@/lib/prisma';
import { DashboardService } from '@/modules/dashboard/DashboardService';
import Link from 'next/link';
import {
  Briefcase,
  Store,
  Factory,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  ClipboardList,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const kpis = await DashboardService.getKPIs();

  // Fetch live telemetry records
  const [recentImports, recentVisits] = await Promise.all([
    prisma.import.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.visit.findMany({
      take: 5,
      orderBy: { scheduledDate: 'desc' },
      include: {
        promoter: true,
        store: true,
        operation: true,
      },
    }),
  ]);

  const sparklines = {
    ops: "M 0 12 Q 15 4 30 10 T 60 2 T 90 14 T 120 6",
    ind: "M 0 15 Q 15 12 30 14 T 60 10 T 90 12 T 120 8",
    lojas: "M 0 8 Q 15 14 30 6 T 60 12 T 90 4 T 120 2",
    prom: "M 0 14 Q 15 10 30 12 T 60 8 T 90 10 T 120 4",
    visits: "M 0 15 Q 15 6 30 12 T 60 2 T 90 10 T 120 2",
    pend: "M 0 6 Q 15 12 30 8 T 60 14 T 90 10 T 120 8",
    errors: kpis.failedImportsCount > 0 
      ? "M 0 15 Q 15 8 30 12 T 60 4 T 90 14 T 120 2"
      : "M 0 15 H 120",
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 md:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#F4F4F5]">
          <div>
            <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">MK9 Telemetria</span>
            <h1 className="text-2xl font-extrabold text-[#09090B] tracking-tight mt-1">Visão Geral Operacional</h1>
            <p className="text-xs font-semibold text-[#71717A] mt-0.5">
              Monitoramento em tempo real de equipes de campo, cobertura e carregamentos de dados.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Link
              href="/dashboard/importacoes"
              className="inline-flex items-center gap-1.5 bg-[#09090B] hover:bg-[#1F1F23] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-[0_1px_2px_rgba(0,0,0,0.1)] active:scale-[0.98]"
            >
              Nova Importação
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Integrated KPI Metrics Panel (Stripe Style) */}
        <div className="bg-white border border-[#F4F4F5] rounded-2xl divide-y md:divide-y-0 md:divide-x divide-[#F4F4F5] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)]">
          
          <div className="p-4 flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wide">Operações</span>
            <span className="text-xl font-black text-[#09090B] tracking-tight tabular-nums">{kpis.totalOperations}</span>
            <svg className="w-full h-6 text-[#71717A] opacity-35" viewBox="0 0 120 20" fill="none">
              <path d={sparklines.ops} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="p-4 flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wide">Indústrias</span>
            <span className="text-xl font-black text-[#09090B] tracking-tight tabular-nums">{kpis.totalIndustries}</span>
            <svg className="w-full h-6 text-[#71717A] opacity-35" viewBox="0 0 120 20" fill="none">
              <path d={sparklines.ind} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="p-4 flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wide">Lojas</span>
            <span className="text-xl font-black text-[#09090B] tracking-tight tabular-nums">{kpis.totalStores}</span>
            <svg className="w-full h-6 text-[#71717A] opacity-35" viewBox="0 0 120 20" fill="none">
              <path d={sparklines.lojas} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="p-4 flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wide">Promotores</span>
            <span className="text-xl font-black text-[#09090B] tracking-tight tabular-nums">{kpis.totalPromoters}</span>
            <svg className="w-full h-6 text-[#71717A] opacity-35" viewBox="0 0 120 20" fill="none">
              <path d={sparklines.prom} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="p-4 flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wide">Visitas</span>
            <span className="text-xl font-black text-[#09090B] tracking-tight tabular-nums">{kpis.totalVisits}</span>
            <svg className="w-full h-6 text-[#16A34A] opacity-40" viewBox="0 0 120 20" fill="none">
              <path d={sparklines.visits} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="p-4 flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wide">Pendentes</span>
            <span className="text-xl font-black text-[#09090B] tracking-tight tabular-nums">{kpis.pendingVisitsCount}</span>
            <svg className="w-full h-6 text-[#71717A] opacity-35" viewBox="0 0 120 20" fill="none">
              <path d={sparklines.pend} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="p-4 flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wide">Erros Lote</span>
            <span className={`text-xl font-black tracking-tight tabular-nums ${kpis.failedImportsCount > 0 ? 'text-[#EF4444]' : 'text-[#09090B]'}`}>{kpis.failedImportsCount}</span>
            <svg className={`w-full h-6 opacity-35 ${kpis.failedImportsCount > 0 ? 'text-[#EF4444] opacity-55' : 'text-[#71717A]'}`} viewBox="0 0 120 20" fill="none">
              <path d={sparklines.errors} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="p-4 flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wide">Último Lote</span>
            <span className="text-[11px] font-bold text-[#3F3F46] tracking-tight truncate leading-none mt-1.5">{kpis.lastImportDate ? new Date(kpis.lastImportDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
            <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-wide pb-1">Processado</span>
          </div>

        </div>

        {/* Dashboard Panels */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Dashboard Info (Left/Center - 66%) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#F4F4F5] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)]">
              <div className="flex items-center justify-between pb-4 border-b border-[#F4F4F5] mb-5">
                <div>
                  <h3 className="text-sm font-bold text-[#09090B]">Roteiro Recente de Visitas</h3>
                  <p className="text-[10px] text-[#A1A1AA] font-semibold">Últimas visitas programadas no sistema</p>
                </div>
                <Link href="/dashboard/visitas" className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] hover:underline">
                  Ver Todas
                </Link>
              </div>

              <div className="space-y-4">
                {recentVisits.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-4 text-center">Nenhuma visita registrada no sistema.</p>
                ) : (
                  recentVisits.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3.5 hover:bg-[#FAFAFA] rounded-xl transition-colors duration-150 border border-[#F4F4F5]/50">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#09090B] truncate">
                          {visit.promoter?.name || 'Sem Promotor'}
                        </span>
                        <span className="text-[10px] text-[#71717A] font-semibold truncate mt-0.5">
                          {visit.store?.name || 'Sem Loja'} • {visit.operation?.name || 'Sem Operação'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[10px] font-bold text-[#A1A1AA] font-mono tracking-tight">
                          {new Date(visit.scheduledDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          visit.status === 'REALIZADA' 
                            ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]'
                            : visit.status === 'PLANEJADA'
                              ? 'bg-[#EFF6FF] border-[#DBEAFE] text-[#3B82F6]'
                              : 'bg-[#FEF2F2] border-[#FEE2E2] text-[#EF4444]'
                        }`}>
                          {visit.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Activities / Telemetry Feed (Right - 33%) */}
          <div className="space-y-6">
            <div className="bg-white border border-[#F4F4F5] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01),_0_1px_2px_rgba(0,0,0,0.005)]">
              <div className="flex items-center justify-between pb-4 border-b border-[#F4F4F5] mb-5">
                <div>
                  <h3 className="text-sm font-bold text-[#09090B]">Lotes de Importação</h3>
                  <p className="text-[10px] text-[#A1A1AA] font-semibold">Feed de telemetria e arquivos carregados</p>
                </div>
                <Link href="/dashboard/importacoes" className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] hover:underline">
                  Histórico
                </Link>
              </div>

              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#F4F4F5]">
                {recentImports.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-4 text-center">Nenhum lote importado.</p>
                ) : (
                  recentImports.map((imp) => (
                    <div key={imp.id} className="relative pl-7 space-y-1">
                      {/* Timeline dot */}
                      <span className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border bg-white flex items-center justify-center ${
                        imp.status === 'CONFIRMED'
                          ? 'border-[#16A34A]'
                          : imp.status === 'FAILED'
                            ? 'border-[#EF4444]'
                            : 'border-[#F59E0B]'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          imp.status === 'CONFIRMED'
                            ? 'bg-[#16A34A]'
                            : imp.status === 'FAILED'
                              ? 'bg-[#EF4444]'
                              : 'bg-[#F59E0B]'
                        }`} />
                      </span>

                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#09090B] truncate leading-none">
                          {imp.fileName}
                        </span>
                        <span className="text-[9px] text-[#A1A1AA] font-semibold font-mono mt-1">
                          {new Date(imp.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
