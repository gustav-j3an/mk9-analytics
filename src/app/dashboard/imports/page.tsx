import React from 'react';
import ImportCard from '@/modules/imports/components/ImportCard';
import { prisma } from '@/lib/prisma';
import { formatDatePtBr, importStatusLabels } from '@/lib/formatters';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ImportsPage() {
  const [imports, operations, industries] = await Promise.all([
    prisma.import.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { _count: { select: { files: true } } },
    }),
    prisma.operation.findMany({ where: { name: { not: 'MK9 - OPERAÇÃO PADRÃO' } }, orderBy: [{ year: 'desc' }, { month: 'desc' }], select: { id: true, name: true, status: true } }),
    prisma.industry.findMany({ where: { archivedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

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
            <h1 className="text-2xl font-extrabold text-[#09090B] tracking-tight mt-1">Nova Importação</h1>
            <p className="text-xs font-semibold text-[#71717A] mt-0.5">
              Envie arquivos CSV ou Excel para validação, mapeamento e preview de dados.
            </p>
          </div>
        </div>

        {/* Dropzone Container */}
        <section className="bg-white border border-[#F4F4F5] rounded-2xl p-6 shadow-[0_1px_3px_rgba(30,31,34,0.04),_0_1px_2px_rgba(30,31,34,0.02)]">
          <ImportCard operations={operations} industries={industries} />
        </section>

        {/* Recent Imports List */}
        <section className="bg-white border border-[#F4F4F5] rounded-2xl shadow-[0_1px_3px_rgba(30,31,34,0.04),_0_1px_2px_rgba(30,31,34,0.02)] overflow-hidden">
          <header className="border-b border-[#F4F4F5] px-6 py-4">
            <h2 className="text-xs font-bold text-[#09090B] uppercase tracking-wider">Importações Recentes</h2>
            <p className="mt-0.5 text-[10px] font-semibold text-[#A1A1AA]">Últimos registros criados pelo fluxo de upload</p>
          </header>

          {imports.length === 0 ? (
            <p className="px-6 py-8 text-center text-xs font-semibold text-[#A1A1AA]">Nenhuma importação registrada.</p>
          ) : (
            <ul className="divide-y divide-[#F4F4F5] px-6">
              {imports.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-xs font-bold text-[#09090B]">
                      {item._count.files > 0 ? `${item._count.files} arquivo${item._count.files === 1 ? '' : 's'}` : 'Arquivo não identificado'}
                    </p>
                    <p className="text-[10px] font-mono font-semibold text-[#A1A1AA]">{formatDatePtBr(item.createdAt, true)}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-[#E4E4E7] bg-[#F4F4F5] text-[#71717A]">
                    {importStatusLabels[item.status] ?? item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  );
}
