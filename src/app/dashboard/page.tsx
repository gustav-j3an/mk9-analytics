import Link from 'next/link';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, ClipboardCheck, Factory, MapPin, Route, Store, Upload, Users, Calendar } from 'lucide-react';
import { DashboardOverviewService } from '@/modules/dashboard/DashboardOverviewService';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  PLANEJADA: 'Planejada',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada'
};

const date = (value: Date, withTime = false) =>
  new Intl.DateTimeFormat('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(value);

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    industry?: string;
    promoter?: string;
    state?: string;
    city?: string;
    store?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    startDate: params.startDate || '',
    endDate: params.endDate || '',
    industryId: params.industry || '',
    promoterId: params.promoter || '',
    state: params.state || '',
    city: params.city || '',
    storeId: params.store || '',
  };

  const data = await DashboardOverviewService.getData(filters);
  const last = data.cards.lastImport;
  const totalVisits = data.cards.planned + data.cards.completed;
  const progress = totalVisits ? Math.round((data.cards.completed / totalVisits) * 100) : 0;

  const kpis = [
    { label: 'Visitas Planejadas', value: data.cards.planned, icon: Route },
    { label: 'Visitas Realizadas', value: data.cards.completed, icon: CheckCircle2 },
    { label: 'Visitas Pendentes', value: data.cards.pending, icon: Calendar },
    { label: 'Cobertura', value: `${progress}%`, icon: CheckCircle2 },
    { label: 'Lojas Atendidas', value: data.cards.stores, icon: Store },
    { label: 'Promotores Ativos', value: data.cards.promoters, icon: Users },
    { label: 'Indústrias', value: data.cards.industries, icon: Factory },
    { label: 'Evidências', value: data.cards.reconciliations, icon: ClipboardCheck },
    { label: 'Divergências', value: data.cards.divergences, icon: AlertTriangle }
  ];

  const field = 'h-10 min-w-0 rounded-xl border border-[var(--mk-border-strong)] bg-[var(--mk-bg-secondary)] px-3 text-xs text-[var(--mk-text)] outline-none focus:ring-1 focus:ring-[var(--mk-primary)]';

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="flex flex-col justify-between gap-5 border-b border-[var(--mk-border)] pb-6 md:flex-row md:items-end">
        <div>
          <p className="mk-label text-[var(--mk-primary)]">Visão executiva</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.035em]">Centro de Operações</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--mk-text-secondary)]">
            Acompanhe a cobertura e a execução das visitas e roteiros em tempo real.
          </p>
        </div>
        <Link href="/dashboard/imports" className="mk-primary-button">
          <Upload className="h-3.5 w-3.5" />Nova importação
        </Link>
      </header>

      {/* Filtros do Dashboard */}
      <section className="mk-filter p-4 bg-white border border-[var(--mk-border)] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <form className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8" method="GET" action="/dashboard">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Início</span>
            <input type="date" name="startDate" defaultValue={filters.startDate} className={field} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Fim</span>
            <input type="date" name="endDate" defaultValue={filters.endDate} className={field} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Indústria</span>
            <select name="industry" defaultValue={filters.industryId} className={field}>
              <option value="">Todas</option>
              {data.options.industries.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Promotor</span>
            <select name="promoter" defaultValue={filters.promoterId} className={field}>
              <option value="">Todos</option>
              {data.options.promoters.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Loja</span>
            <select name="store" defaultValue={filters.storeId} className={field}>
              <option value="">Todas</option>
              {data.options.stores.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">UF</span>
            <select name="state" defaultValue={filters.state} className={field}>
              <option value="">Todas</option>
              {data.options.states.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--mk-text-subtle)] uppercase">Cidade</span>
            <select name="city" defaultValue={filters.city} className={field}>
              <option value="">Todas</option>
              {data.options.cities.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2 col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1">
            <button type="submit" className="mk-primary-button w-full h-10 flex items-center justify-center">Filtrar</button>
            <a href="/dashboard" className="mk-secondary-button w-full h-10 flex items-center justify-center text-center">Limpar</a>
          </div>
        </form>
      </section>

      {/* Indicadores Principais */}
      <section aria-label="Indicadores principais" className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isWarning = kpi.label === 'Divergências' && Number(kpi.value) > 0;
          return (
            <article key={kpi.label} className={`mk-kpi ${isWarning ? 'border-[color-mix(in_srgb,var(--mk-warning)_36%,var(--mk-border))]' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="mk-label">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{kpi.value}</p>
                </div>
                <span className="mk-kpi-icon">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <section className="mk-panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mk-label">Execução de visitas</p>
              <h2 className="mt-1 text-lg font-bold">Planejadas versus realizadas</h2>
            </div>
            <span className="text-2xl font-bold text-[var(--mk-primary)] tabular-nums">{progress}%</span>
          </div>
          <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-[var(--mk-bg-secondary)]">
            <div className="h-full rounded-full bg-[var(--mk-primary)] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <Summary label="Planejadas" value={data.cards.planned} />
            <Summary label="Realizadas" value={data.cards.completed} />
            <Summary label="Total acompanhado" value={totalVisits} />
          </div>
        </section>

        <section className="mk-panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="mk-label">Última importação</p>
              <h2 className="mt-1 text-lg font-bold">{last?.files[0]?.fileName || 'Nenhum arquivo'}</h2>
            </div>
            <Upload className="h-5 w-5 text-[var(--mk-primary)]" />
          </div>
          {last ? (
            <>
              <p className="mt-3 text-sm text-[var(--mk-text-secondary)]">Processada em {date(last.createdAt, true)}</p>
              <span className="mk-status mk-status-info mt-4">{last.status}</span>
            </>
          ) : (
            <p className="mt-4 text-sm text-[var(--mk-text-subtle)]">Envie o primeiro arquivo para iniciar o histórico.</p>
          )}
          <Link href="/dashboard/importacoes" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[var(--mk-primary)]">
            Ver importações <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        {/* Substituição de Operações Recentes por Visitas Recentes */}
        <section className="mk-panel overflow-hidden">
          <SectionHeader title="Visitas recentes" description="Últimos roteiros planejados e execuções registradas" action="/dashboard/visitas" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr>
                  {['Loja', 'Promotor', 'Indústria', 'Data Planejada', 'Status'].map(x => (
                    <th key={x} className="px-5 py-3">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--mk-border)]">
                {data.activities
                  .filter(x => x.type === 'Visita')
                  .slice(0, 6)
                  .map(x => {
                    const descParts = x.description.split(' · ');
                    const visitOpName = descParts[0] || '';
                    const visitStatus = descParts[1] || '';
                    return (
                      <tr key={x.id}>
                        <td className="px-5 py-3.5 font-semibold text-[var(--mk-text)]">
                          {visitOpName}
                        </td>
                        <td className="px-5 py-3.5">Promotor</td>
                        <td className="px-5 py-3.5">Indústria</td>
                        <td className="px-5 py-3.5">{date(x.date)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`mk-status ${visitStatus === 'REALIZADA' ? 'mk-status-success' : 'mk-status-info'}`}>
                            {statusLabels[visitStatus] || visitStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {!data.activities.filter(x => x.type === 'Visita').length && (
              <Empty text="Nenhuma visita registrada recentemente." />
            )}
          </div>
        </section>

        <section className="mk-panel p-5">
          <div className="flex items-center gap-3">
            <span className="mk-kpi-icon">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <p className="mk-label">Atenção necessária</p>
              <h2 className="mt-1 text-lg font-bold">Pendências operacionais</h2>
            </div>
          </div>
          <p className="mt-6 text-4xl font-bold tabular-nums">{data.cards.divergences}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--mk-text-secondary)]">
            Evidências de auditoria que aguardam conciliação.
          </p>
          <Link href="/dashboard/conciliacao" className="mk-secondary-button mt-5 w-full">Abrir conciliação</Link>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Chart title="Visitas por UF" data={data.charts.byState} />
        <Chart title="Visitas por indústria" data={data.charts.byIndustry} />
      </div>

      <section className="mk-panel overflow-hidden">
        <SectionHeader title="Últimas atividades" description="Movimentações recentes registradas no sistema" />
        <div className="divide-y divide-[var(--mk-border)] px-5">
          {data.activities.slice(0, 7).map(x => (
            <div key={x.id} className="grid gap-1 py-3.5 text-xs sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:gap-3">
              <span className="font-bold text-[var(--mk-info)]">{x.type}</span>
              <span className="truncate text-[var(--mk-text-secondary)]">{x.description}</span>
              <time className="text-[var(--mk-text-subtle)]">{date(x.date, true)}</time>
            </div>
          ))}
          {!data.activities.length && <Empty text="Nenhuma atividade registrada." />}
        </div>
      </section>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[var(--mk-text-subtle)]">{label}</p>
      <p className="mt-1 font-bold tabular-nums text-[var(--mk-text)]">{value}</p>
    </div>
  );
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--mk-border)] px-5 py-4">
      <div>
        <h2 className="text-sm font-bold">{title}</h2>
        <p className="mt-1 text-xs text-[var(--mk-text-subtle)]">{description}</p>
      </div>
      {action && (
        <Link href={action} className="text-xs font-bold text-[var(--mk-primary)]">
          Ver todas
        </Link>
      )}
    </header>
  );
}

function Chart({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map(x => x.value));
  return (
    <section className="mk-panel p-5">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="mt-5 space-y-3.5">
        {data.slice(0, 6).map(x => (
          <div key={x.label} className="grid grid-cols-[100px_1fr_34px] items-center gap-3 text-xs">
            <span className="truncate" title={x.label}>
              {x.label}
            </span>
            <div className="h-1.5 rounded-full bg-[var(--mk-bg-secondary)]">
              <div className="h-full rounded-full bg-[var(--mk-primary)]" style={{ width: `${(x.value / max) * 100}%` }} />
            </div>
            <span className="text-right font-mono text-[var(--mk-text-subtle)]">{x.value}</span>
          </div>
        ))}
        {!data.length && <Empty text="Sem dados disponíveis." />}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-[var(--mk-text-subtle)]">{text}</p>;
}