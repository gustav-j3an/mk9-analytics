import { OperationCard } from '@/components/operations/OperationCard';
import { OperationFilters } from '@/components/operations/OperationFilters';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { OperationsDashboardService } from '@/modules/operations/dashboard/OperationsDashboardService';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps { searchParams: Promise<{ status?: string; cliente?: string; q?: string; page?: string; pageSize?: string }> }

export default async function OperacoesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params?.status || '';
  const cliente = params?.cliente || '';
  const search = params?.q || '';
  const page = Number(params?.page) || 1;
  const pageSize = Number(params?.pageSize) || 10;
  const { operations, stats, uniqueClients, pagination } = await OperationsDashboardService.getDashboardData({ status, cliente, search, page, pageSize });

  return (
    <main className="mx-auto w-full max-w-[1440px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <PageHeader category="Operação" title="Gestão de operações" subtitle="Planejamento, equipes, clientes e execução de cada operação comercial." actions={<Link href="/dashboard/operacoes/nova" className="rounded-md bg-[#20201f] px-4 py-2.5 text-xs font-medium text-white">Nova operação</Link>} />
      <OperationCard stats={stats} />
      <OperationFilters status={status} cliente={cliente} search={search} uniqueClients={uniqueClients} />
      <OperationsTable operations={operations} pagination={pagination} query={{ status, cliente, q: search }} />
    </main>
  );
}
