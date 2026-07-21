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
      <PageHeader category="Operação" title="Importações" subtitle="Envio de arquivos e histórico de processamento." actions={<Link href="/dashboard/imports" className="rounded-md bg-[#20201f] px-3.5 py-2 text-xs font-medium text-white">Nova importação</Link>} />
      <ImportStats stats={stats} />
      <form className="flex flex-wrap items-end gap-2 rounded-md border bg-white p-3"><label className="space-y-1"><span className="block text-xs font-medium">Operação</span><select name="operationId" defaultValue={operationId} className="h-9 min-w-[260px] rounded-md border bg-white px-3 text-xs"><option value="">Todas, incluindo sem vínculo</option>{operations.map((operation) => <option key={operation.id} value={operation.id}>{operation.name}</option>)}</select></label><button className="h-9 rounded-md bg-[#20201f] px-4 text-xs text-white">Filtrar</button><Link href="/dashboard/importacoes" className="flex h-9 items-center rounded-md border px-4 text-xs">Limpar</Link></form>
      <ImportsTable imports={imports} />
    </main>
  );
}
