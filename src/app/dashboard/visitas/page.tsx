import React from 'react';
import { VisitsSummary } from '@/components/visits/VisitsSummary';
import { VisitsTable } from '@/components/visits/VisitsTable';
import { VisitsFilters } from '@/components/visits/VisitsFilters';
import { VisitsDashboardService } from '@/modules/visits/dashboard/VisitsDashboardService';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    promoter?: string;
    supervisor?: string;
    operation?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function VisitasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const promoter = params?.promoter || '';
  const supervisor = params?.supervisor || '';
  const operation = params?.operation || '';
  const status = params?.status || '';
  const startDate = params?.startDate || '';
  const endDate = params?.endDate || '';

  const {
    visits,
    summary,
    uniquePromoters,
    uniqueSupervisors,
    uniqueOperations,
  } = await VisitsDashboardService.getDashboardData({
    promoter,
    supervisor,
    operation,
    status,
    startDate,
    endDate,
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 md:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#F4F4F5]">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="p-1 hover:bg-[#F4F4F5] rounded-lg text-[#71717A] transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">MK9 Analytics</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#09090B] tracking-tight mt-1">Painel de Visitas</h1>
            <p className="text-xs font-semibold text-[#71717A] mt-0.5">
              Monitore roteiros planejados, acompanhamento de atrasos e visualização de fotos e checklists.
            </p>
          </div>
        </div>

        {/* Summary (KPIs & Rankings) */}
        <VisitsSummary summary={summary} />

        {/* Filters */}
        <VisitsFilters
          promoter={promoter}
          supervisor={supervisor}
          operation={operation}
          status={status}
          startDate={startDate}
          endDate={endDate}
          uniquePromoters={uniquePromoters}
          uniqueSupervisors={uniqueSupervisors}
          uniqueOperations={uniqueOperations}
        />

        {/* Table */}
        <VisitsTable visits={visits} />

      </div>
    </div>
  );
}
