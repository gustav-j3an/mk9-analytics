import { PageHeader } from '@/components/ui/PageHeader';
import { RoutesWorkspace } from '@/components/routes/RoutesWorkspace';
import { RoutesDashboardService } from '@/modules/routes/dashboard/RoutesDashboardService';
import { isRouteSchemaMismatch, logRouteServerError, ROUTE_SCHEMA_MESSAGE } from '@/modules/routes/errors/RouteDatabaseError';
import { getOrCreateDefaultOperationId } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    promoter?: string;
    industry?: string;
    week?: string;
    month?: string;
    year?: string;
    store?: string;
    city?: string;
    state?: string;
  }>;
}

function monday(value?: string) {
  const base = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00.000Z`) : new Date();
  const day = base.getUTCDay();
  base.setUTCDate(base.getUTCDate() - (day === 0 ? 6 : day - 1));
  base.setUTCHours(12, 0, 0, 0);
  return base;
}

function getFirstMondayOfMonth(year: number, month: number): Date {
  const date = new Date(Date.UTC(year, month - 1, 1, 12));
  const day = date.getUTCDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

export default async function RoteirosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const defaultOperationId = await getOrCreateDefaultOperationId();

  let weekParam = params.week;
  if (!weekParam && params.month && params.year) {
    const computed = getFirstMondayOfMonth(Number(params.year), Number(params.month));
    weekParam = computed.toISOString().slice(0, 10);
  }

  const weekStart = monday(weekParam);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86_400_000);

  let data;
  try {
    data = await RoutesDashboardService.getData({
      promoterId: params.promoter,
      industryId: params.industry,
      startDate: weekStart,
      endDate: new Date(weekEnd.getTime() + 43_199_999),
      storeId: params.store,
      city: params.city,
      state: params.state,
    });
  } catch (error) {
    logRouteServerError('load-weekly-dashboard', '/dashboard/roteiros', error);
    if (isRouteSchemaMismatch(error)) {
      return (
        <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <PageHeader category="Operação" title="Planejamento de roteiros" subtitle="Editor semanal manual por promotor, dia, loja e indústria." />
          <section role="alert" className="mk-panel border-[var(--mk-warning)] p-6">
            <h2 className="text-sm font-bold">Atualização do banco pendente</h2>
            <p className="mt-2 text-xs text-[var(--mk-text-secondary)]">{ROUTE_SCHEMA_MESSAGE}</p>
          </section>
        </main>
      );
    }
    throw error;
  }

  const field = 'h-10 min-w-0 rounded-xl border border-[var(--mk-border-strong)] bg-[var(--mk-bg-secondary)] px-3 text-xs text-[var(--mk-text)] outline-none';

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const uniqueCities = [...new Set(data.options.stores.map(s => s.city).filter(Boolean))].sort();
  const uniqueStates = [...new Set(data.options.stores.map(s => s.state).filter(Boolean))].sort();

  return (
    <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <PageHeader category="Operação" title="Planejamento de roteiros" subtitle="Editor semanal manual por promotor, dia, loja e indústria." />
      
      <section className="mk-filter p-4 bg-white border border-[var(--mk-border)] rounded-2xl">
        <form className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8" action="/dashboard/roteiros">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Semana (Início)</span>
            <input type="date" name="week" defaultValue={weekStart.toISOString().slice(0, 10)} className={field} />
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Mês</span>
            <select name="month" defaultValue={params.month ?? ''} className={field}>
              <option value="">Todos</option>
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Ano</span>
            <select name="year" defaultValue={params.year ?? ''} className={field}>
              <option value="">Todos</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Indústria</span>
            <select name="industry" defaultValue={params.industry ?? ''} className={field}>
              <option value="">Todas</option>
              {data.options.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Promotor</span>
            <select name="promoter" defaultValue={params.promoter ?? ''} className={field}>
              <option value="">Todos</option>
              {data.options.promoters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Loja</span>
            <select name="store" defaultValue={params.store ?? ''} className={field}>
              <option value="">Todas</option>
              {data.options.stores.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">UF</span>
            <select name="state" defaultValue={params.state ?? ''} className={field}>
              <option value="">Todas</option>
              {uniqueStates.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Cidade</span>
            <select name="city" defaultValue={params.city ?? ''} className={field}>
              <option value="">Todas</option>
              {uniqueCities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="flex items-end gap-2 col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-8 lg:justify-end">
            <button className="mk-primary-button px-6 h-10">Filtrar</button>
            <a href="/dashboard/roteiros" className="mk-secondary-button px-6 h-10 flex items-center justify-center">Limpar</a>
          </div>
        </form>
      </section>

      <RoutesWorkspace
        days={data.days}
        options={data.options}
        weekStart={weekStart.toISOString()}
        weekEnd={weekEnd.toISOString()}
        defaultOperationId={defaultOperationId}
      />
    </main>
  );
}
