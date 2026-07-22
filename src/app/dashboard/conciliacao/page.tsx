import { PageHeader } from '@/components/ui/PageHeader';
import { ReconciliationDashboardRepository } from '@/modules/reconciliation/ReconciliationDashboardRepository';
import { ReconciliationDashboardView } from '@/modules/reconciliation/ReconciliationDashboardView';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const data = await ReconciliationDashboardRepository.getData({
    operationId: query.operation || undefined,
    promoterId: query.promoter || undefined,
    industryId: query.industry || undefined,
    storeId: query.store || undefined,
    result: query.result as never || undefined,
    state: query.state ? query.state : undefined,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
  });
  return ReconciliationDashboardView({ data });
}
