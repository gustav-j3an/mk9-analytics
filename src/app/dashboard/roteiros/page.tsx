import { PageHeader } from '@/components/ui/PageHeader';
import { RoutesWorkspace } from '@/components/routes/RoutesWorkspace';
import { RoutesDashboardService } from '@/modules/routes/dashboard/RoutesDashboardService';

export const dynamic = 'force-dynamic';

interface PageProps { searchParams: Promise<{ promoter?: string; operation?: string; industry?: string }> }

export default async function RoteirosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await RoutesDashboardService.getData({ promoterId: params.promoter, operationId: params.operation, industryId: params.industry });
  const field = 'h-10 min-w-0 rounded-xl border border-[var(--mk-border-strong)] bg-[var(--mk-bg-secondary)] px-3 text-xs text-[var(--mk-text)]';
  return <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <PageHeader category="Operação" title="Planejamento de roteiros" subtitle="Agenda de segunda a sábado por promotor, operação e indústria." />
    <section className="mk-filter">
      <form className="grid gap-3 md:grid-cols-4" action="/dashboard/roteiros">
        <select name="promoter" defaultValue={params.promoter ?? ''} className={field}><option value="">Todos os promotores</option>{data.options.promoters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="operation" defaultValue={params.operation ?? ''} className={field}><option value="">Todas as operações</option>{data.options.operations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="industry" defaultValue={params.industry ?? ''} className={field}><option value="">Todas as indústrias</option>{data.options.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <div className="flex gap-2"><button className="mk-primary-button">Filtrar</button><a href="/dashboard/roteiros" className="mk-secondary-button">Limpar</a></div>
      </form>
      <p className="mt-3 text-xs text-[var(--mk-text-subtle)]">{data.total} visita(s) no roteiro filtrado.</p>
    </section>
    <RoutesWorkspace days={data.days} />
  </main>;
}
