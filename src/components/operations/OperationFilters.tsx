import { Search } from 'lucide-react';

interface OperationFiltersProps { status?: string; cliente?: string; search?: string; uniqueClients: string[] }

export function OperationFilters({ status = '', cliente = '', search = '', uniqueClients }: OperationFiltersProps) {
  const fieldClass = 'h-9 min-w-0 rounded-md border border-[#d9d9d4] bg-white px-3 text-xs text-[#393937] outline-none focus:border-[#999994]';
  return (
    <form method="GET" action="/dashboard/operacoes" className="grid min-w-0 gap-2 rounded-md border border-[#deded9] bg-white p-3 md:grid-cols-[minmax(180px,1fr)_160px_180px_100px_auto]">
      <div className="relative min-w-0"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#92928d]" /><input name="q" defaultValue={search} placeholder="Buscar operação" className={`${fieldClass} w-full pl-9`} /></div>
      <select name="status" defaultValue={status} className={fieldClass}><option value="">Todos os status</option><option value="PLANNING">Planejamento</option><option value="OPEN">Aberta</option><option value="IN_PROGRESS">Em andamento</option><option value="FINISHED">Finalizada</option><option value="CANCELLED">Cancelada</option><option value="ARCHIVED">Arquivada</option></select>
      <select name="cliente" defaultValue={cliente} className={fieldClass}><option value="">Todos os clientes</option>{uniqueClients.map((client) => <option key={client} value={client}>{client}</option>)}</select>
      <select name="pageSize" defaultValue="10" className={fieldClass}><option value="5">5 por pagina</option><option value="10">10 por pagina</option><option value="25">25 por pagina</option><option value="50">50 por pagina</option></select>
      <div className="flex gap-2"><button className="h-9 rounded-md bg-[#20201f] px-4 text-xs font-medium text-white">Filtrar</button><a href="/dashboard/operacoes" className="flex h-9 items-center rounded-md border border-[#d9d9d4] px-3 text-xs text-[#62625e]">Limpar</a></div>
    </form>
  );
}

export default OperationFilters;
