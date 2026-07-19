import React from 'react';
import { ImportsTable } from '@/components/imports/ImportsTable';
import { ImportStats } from '@/components/imports/ImportStats';
import { ImportsDashboardService } from '@/modules/imports/dashboard/ImportsDashboardService';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ImportacoesPage() {
  const { imports, stats } = await ImportsDashboardService.getDashboardData();

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
            <h1 className="text-2xl font-extrabold text-[#09090B] tracking-tight mt-1">Histórico de Importações</h1>
            <p className="text-xs font-semibold text-[#71717A] mt-0.5">
              Gerencie e acompanhe todos os arquivos de roteiros carregados no sistema.
            </p>
          </div>
        </div>

        {/* Stats */}
        <ImportStats stats={stats} />

        {/* List Table */}
        <ImportsTable imports={imports} />

      </div>
    </div>
  );
}
