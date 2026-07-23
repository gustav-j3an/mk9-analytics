import { PageHeader } from '@/components/ui/PageHeader';
import { RoutesWorkspace } from '@/components/routes/RoutesWorkspace';
import { RoutesDashboardService } from '@/modules/routes/dashboard/RoutesDashboardService';

export const dynamic = 'force-dynamic';

interface PageProps { searchParams: Promise<{ promoter?: string; operation?: string; industry?: string; week?: string }> }

function monday(value?: string) {
  const base = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00.000Z`) : new Date();
  const day = base.getUTCDay();
  base.setUTCDate(base.getUTCDate() - (day === 0 ? 6 : day - 1));
  base.setUTCHours(12, 0, 0, 0);
  return base;
}

export default async function RoteirosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekStart = monday(params.week);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86_400_000);
  const data = await RoutesDashboardService.getData({ promoterId: params.promoter, operationId: params.operation, industryId: params.industry, startDate: weekStart, endDate: new Date(weekEnd.getTime() + 43_199_999) });
  const field = 'h-10 min-w-0 rounded-xl border border-[var(--mk-border-strong)] bg-[var(--mk-bg-secondary)] px-3 text-xs text-[var(--mk-text)]';
  return <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <PageHeader category="Operação" title="Planejamento de roteiros" subtitle="Editor semanal manual por promotor, dia, loja e indústria." />
    <section className="mk-filter">
      <form className="grid gap-3 md:grid-cols-5" action="/dashboard/roteiros">
        <input type="date" name="week" defaultValue={weekStart.toISOString().slice(0, 10)} className={field} />
        <select name="promoter" defaultValue={params.promoter ?? ''} className={field}><option value="">Todos os promotores</option>{data.options.promoters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="operation" defaultValue={params.operation ?? ''} className={field}><option value="">Todas as operações</option>{data.options.operations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="industry" defaultValue={params.industry ?? ''} className={field}><option value="">Todas as indústrias</option>{data.options.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <div className="flex gap-2"><button className="mk-primary-button">Filtrar</button><a href="/dashboard/roteiros" className="mk-secondary-button">Limpar</a></div>
      </form>
    </section>
    <RoutesWorkspace days={data.days} options={data.options} weekStart={weekStart.toISOString()} weekEnd={weekEnd.toISOString()} />
  </main>;
}
