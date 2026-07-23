import Link from 'next/link';
import { ImportsTable } from '@/components/imports/ImportsTable';
import { ImportStats } from '@/components/imports/ImportStats';
import { PageHeader } from '@/components/ui/PageHeader';
import { ImportsDashboardService } from '@/modules/imports/dashboard/ImportsDashboardService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ImportacoesPage({ searchParams }: { searchParams: Promise<{ operationId?: string }> }) {
  const operationId = (await searchParams).operationId || '';
  const [{ imports, stats }, operations] = await Promise.all([ImportsDashboardService.getDashboardData(operationId || undefined), prisma.operation.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, name: true } })]);
  return (
    <main className="mx-auto w-full max-w-[1440px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <PageHeader category="Operação" title="Importações" subtitle="Envio de arquivos e histórico de processamento." actions={<Link href="/dashboard/imports" className="mk-primary-button">Nova importação</Link>} />
      <ImportStats stats={stats} />
      <form className="mk-filter flex flex-wrap items-end gap-3"><label className="space-y-1"><span className="block text-xs font-medium">Operação</span><select name="operationId" defaultValue={operationId} className="h-10 min-w-[260px] rounded-xl px-3 text-xs"><option value="">Todas, incluindo sem vínculo</option>{operations.map((operation) => <option key={operation.id} value={operation.id}>{operation.name}</option>)}</select></label><button className="mk-primary-button">Filtrar</button><Link href="/dashboard/importacoes" className="mk-secondary-button">Limpar</Link></form>
      <ImportsTable imports={imports} />
    </main>
  );
}
