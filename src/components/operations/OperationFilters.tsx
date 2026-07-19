import React from 'react';
import { Search } from 'lucide-react';

interface OperationFiltersProps {
  status?: string;
  cliente?: string;
  search?: string;
  uniqueClients: string[];
}

export const OperationFilters = ({
  status = '',
  cliente = '',
  search = '',
  uniqueClients,
}: OperationFiltersProps) => {
  return (
    <form method="GET" action="/dashboard/operacoes" className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs gap-4 flex flex-col md:flex-row items-stretch md:items-center justify-between mb-6">
      <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Buscar operação por nome..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro Status */}
        <select
          name="status"
          defaultValue={status}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="PLANNING">Planejamento</option>
          <option value="OPEN">Aberta</option>
          <option value="IN_PROGRESS">Em Andamento</option>
          <option value="FINISHED">Finalizada</option>
          <option value="CANCELLED">Cancelada</option>
          <option value="ARCHIVED">Arquivada</option>
        </select>

        {/* Filtro Cliente */}
        <select
          name="cliente"
          defaultValue={cliente}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os clientes</option>
          {uniqueClients.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Filtrar
        </button>
        <a
          href="/dashboard/operacoes"
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-sm px-4 py-2 rounded-xl transition-colors text-center flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Limpar
        </a>
      </div>
    </form>
  );
};
