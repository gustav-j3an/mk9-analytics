import { PageHeader } from '@/components/ui/PageHeader';
import { VisitsFilters } from '@/components/visits/VisitsFilters';
import { VisitsSummary } from '@/components/visits/VisitsSummary';
import { VisitsTable } from '@/components/visits/VisitsTable';
import { VisitsDashboardService } from '@/modules/visits/dashboard/VisitsDashboardService';

export const dynamic = 'force-dynamic';

interface PageProps { searchParams: Promise<{ promoter?: string; supervisor?: string; status?: string; startDate?: string; endDate?: string; industry?: string; store?: string }> }

export default async function VisitasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    promoter: params?.promoter || '', supervisor: params?.supervisor || '',
    status: params?.status || '', startDate: params?.startDate || '', endDate: params?.endDate || '',
    industry: params?.industry || '', store: params?.store || '',
  };
  const data = await VisitsDashboardService.getDashboardData(filters);

  return (
    <main className="mx-auto w-full max-w-[1440px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <PageHeader category="Operação" title="Visitas" subtitle="Roteiros planejados, execução e acompanhamento de atrasos." />
      <VisitsSummary summary={data.summary} />
      <VisitsFilters {...filters} uniquePromoters={data.uniquePromoters} uniqueSupervisors={data.uniqueSupervisors} uniqueIndustries={data.uniqueIndustries} uniqueStores={data.uniqueStores} />
      <VisitsTable visits={data.visits} />
    </main>
  );
}
