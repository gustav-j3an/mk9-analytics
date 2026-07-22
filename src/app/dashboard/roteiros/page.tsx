import { PageHeader } from '@/components/ui/PageHeader';
import { WeeklyRouteCalendar } from '@/components/routes/WeeklyRouteCalendar';
import { RoutesDashboardService } from '@/modules/routes/dashboard/RoutesDashboardService';

export const dynamic = 'force-dynamic';

interface PageProps { searchParams: Promise<{ promoter?: string; operation?: string; industry?: string }> }

export default async function RoteirosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await RoutesDashboardService.getData({ promoterId: params.promoter, operationId: params.operation, industryId: params.industry });
  const field = 'h-9 min-w-0 rounded-md border border-[#d9d9d4] bg-white px-3 text-xs text-[#292928]';
  return <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <PageHeader category="Operação" title="Roteiros semanais" subtitle="Agenda de segunda a sábado por promotor, operação e indústria." />
    <section className="rounded-xl border border-[#deded9] bg-white p-4">
      <form className="grid gap-3 md:grid-cols-4" action="/dashboard/roteiros">
        <select name="promoter" defaultValue={params.promoter ?? ''} className={field}><option value="">Todos os promotores</option>{data.options.promoters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="operation" defaultValue={params.operation ?? ''} className={field}><option value="">Todas as operações</option>{data.options.operations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="industry" defaultValue={params.industry ?? ''} className={field}><option value="">Todas as indústrias</option>{data.options.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <div className="flex gap-2"><button className="h-9 rounded-md bg-[#20201f] px-4 text-xs font-semibold text-white">Filtrar</button><a href="/dashboard/roteiros" className="flex h-9 items-center rounded-md border border-[#d9d9d4] px-3 text-xs text-[#62625e]">Limpar</a></div>
      </form>
      <p className="mt-3 text-xs text-[#73736f]">{data.total} visita(s) no roteiro filtrado.</p>
    </section>
    <WeeklyRouteCalendar days={data.days} />
  </main>;
}
