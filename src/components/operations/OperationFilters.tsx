import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';

interface Props {
  status?: string; cliente?: string; search?: string; uniqueClients: string[]; archived?: string;
  sort?: string; direction?: string; pageSize?: number;
}

export function OperationFilters({ status = '', cliente = '', search = '', uniqueClients, archived = '', sort = 'updatedAt', direction = 'desc', pageSize = 10 }: Props) {
  const field = 'h-10 min-w-0 rounded-xl border border-[var(--mk-border-strong)] bg-[var(--mk-bg-secondary)] px-3 text-xs text-[var(--mk-text)]';
  return <form method="GET" action="/dashboard/operacoes" className="mk-filter space-y-3">
    <div className="flex items-center gap-2 text-xs font-bold"><SlidersHorizontal className="h-4 w-4 text-[var(--mk-primary)]" />Filtros e ordenação</div>
    <div className="grid min-w-0 gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_170px_150px_120px_90px_auto]">
      <label className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--mk-text-subtle)]" /><input name="q" defaultValue={search} placeholder="Buscar nome, cliente ou responsável" className={`${field} w-full pl-9`} /></label>
      <select name="status" defaultValue={status} className={field}><option value="">Todos os status</option><option value="PLANNING">Planejamento</option><option value="OPEN">Aberta</option><option value="IN_PROGRESS">Em andamento</option><option value="FINISHED">Finalizada</option><option value="CANCELLED">Cancelada</option><option value="ARCHIVED">Arquivada</option></select>
      <select name="cliente" defaultValue={cliente} className={field}><option value="">Todos os clientes</option>{uniqueClients.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select name="sort" defaultValue={sort} className={field}><option value="updatedAt">Última atualização</option><option value="name">Nome</option><option value="startsAt">Período</option><option value="coverage">Cobertura</option></select>
      <select name="direction" defaultValue={direction} className={field}><option value="desc">Decrescente</option><option value="asc">Crescente</option></select>
      <select name="pageSize" defaultValue={String(pageSize)} className={field}><option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option></select>
      <div className="flex gap-2"><button className="mk-primary-button">Aplicar</button><Link href="/dashboard/operacoes" className="mk-secondary-button">Limpar</Link></div>
    </div>
    <label className="inline-flex items-center gap-2 text-xs text-[var(--mk-text-secondary)]"><input type="checkbox" name="archived" value="all" defaultChecked={archived === 'all'} />Incluir operações arquivadas</label>
  </form>;
}

export default OperationFilters;
