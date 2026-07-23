import Link from 'next/link';
import { ArrowRight, Building2, CalendarDays, Factory, MapPin, Users, Route, CheckCircle2, AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDatePtBr } from '@/lib/formatters';
import type { OperationItem, OperationsPagination } from '@/modules/operations/dashboard/operations-dashboard.types';

type Props = { operations: OperationItem[]; pagination: OperationsPagination; query: Record<string, string> };
const labels: Record<string, string> = { PLANNING: 'Planejada', OPEN: 'Ativa', IN_PROGRESS: 'Em andamento', FINISHED: 'Finalizada', CANCELLED: 'Cancelada', ARCHIVED: 'Arquivada' };
const tone = (status: string) => status === 'FINISHED' ? 'mk-status-success' : status === 'CANCELLED' || status === 'ARCHIVED' ? 'mk-status-danger' : status === 'PLANNING' ? 'mk-status-warning' : 'mk-status-info';
function href(page: number, pagination: OperationsPagination, query: Record<string, string>) { const params = new URLSearchParams({ ...query, page: String(page), pageSize: String(pagination.pageSize) }); for (const [key, value] of [...params]) if (!value) params.delete(key); return `/dashboard/operacoes?${params}`; }

export function OperationsTable({ operations, pagination, query }: Props) {
  if (!operations.length) return <EmptyState title="Nenhuma operação encontrada" description="Ajuste os filtros ou cadastre uma operação." />;
  return <section className="space-y-3">
    {operations.map((item) => <article key={item.id} className="mk-panel group overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-[var(--mk-border-strong)] hover:shadow-[var(--mk-shadow)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:w-[31%]">
          <div className="flex flex-wrap items-center gap-2"><span className={`mk-status ${tone(item.status)}`}>{labels[item.status]}</span><span className="text-[10px] text-[var(--mk-text-subtle)]">{item.clientId || 'Cliente não informado'}</span></div>
          <Link href={`/dashboard/operacoes/${item.id}`} className="mt-2 block truncate text-base font-bold group-hover:text-[var(--mk-primary)]">{item.name}</Link>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--mk-text-subtle)]"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDatePtBr(item.startsAt)} — {formatDatePtBr(item.endsAt)}</span><span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{item.responsible}</span></div>
          <p className="mt-2 text-[10px] text-[var(--mk-text-subtle)]">Atualizada em {formatDatePtBr(item.updatedAt, true)}</p>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          <Metric icon={MapPin} label="Lojas" value={item.storesCount} /><Metric icon={Users} label="Promotores" value={item.promotersCount} /><Metric icon={Factory} label="Indústrias" value={item.industriesCount} />
          <Metric icon={Route} label="Planejadas" value={item.visitsPlannedCount} /><Metric icon={CheckCircle2} label="Realizadas" value={item.visitsExecutedCount} /><Metric icon={AlertTriangle} label="Pendências" value={item.pendingCount} />
          <div className="rounded-xl bg-[var(--mk-bg-secondary)] p-3"><p className="mk-label">Cobertura</p><p className="mt-1 text-lg font-bold">{item.coverage}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--mk-border)]"><div className="h-full rounded-full bg-[var(--mk-primary)]" style={{ width: `${Math.min(100, item.coverage)}%` }} /></div></div>
        </div>
        <Link href={`/dashboard/operacoes/${item.id}`} className="mk-secondary-button self-end xl:self-center">Administrar<ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </article>)}
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--mk-border)] bg-[var(--mk-card)] px-4 py-3 text-xs text-[var(--mk-text-subtle)] sm:flex-row sm:items-center sm:justify-between"><span>{pagination.total} registro(s) · Página {pagination.page} de {pagination.totalPages}</span><div className="flex gap-2">{pagination.page > 1 && <Link className="mk-secondary-button min-h-8 px-3" href={href(pagination.page - 1, pagination, query)}>Anterior</Link>}{pagination.page < pagination.totalPages && <Link className="mk-secondary-button min-h-8 px-3" href={href(pagination.page + 1, pagination, query)}>Próxima</Link>}</div></div>
  </section>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) { return <div className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-card)] p-3"><Icon className="h-3.5 w-3.5 text-[var(--mk-primary)]" /><p className="mt-2 mk-label">{label}</p><p className="mt-1 text-lg font-bold tabular-nums">{value}</p></div>; }
