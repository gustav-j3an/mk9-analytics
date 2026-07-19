import React from 'react';
import { OperationCard } from '@/components/operations/OperationCard';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { OperationFilters } from '@/components/operations/OperationFilters';
import { OperationsDashboardService } from '@/modules/operations/dashboard/OperationsDashboardService';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    cliente?: string;
    q?: string;
  }>;
}

export default async function OperacoesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params?.status || '';
  const cliente = params?.cliente || '';
  const search = params?.q || '';

  const { operations, stats, uniqueClients } = await OperationsDashboardService.getDashboardData({
    status,
    cliente,
    search,
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
            <h1 className="text-2xl font-extrabold text-[#09090B] tracking-tight mt-1">Visão Operacional</h1>
            <p className="text-xs font-semibold text-[#71717A] mt-0.5">
              Monitore a cobertura de visitas, status de execução e equipes de promotores por operação.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <OperationCard stats={stats} />

        {/* Filters */}
        <OperationFilters
          status={status}
          cliente={cliente}
          search={search}
          uniqueClients={uniqueClients}
        />

        {/* List Table */}
        <OperationsTable operations={operations} />

      </div>
    </div>
  );
}
