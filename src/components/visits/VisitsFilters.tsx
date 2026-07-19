import React from 'react';
import { Filter } from 'lucide-react';

interface VisitsFiltersProps {
  promoter?: string;
  supervisor?: string;
  operation?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  uniquePromoters: string[];
  uniqueSupervisors: string[];
  uniqueOperations: string[];
}

export const VisitsFilters = ({
  promoter = '',
  supervisor = '',
  operation = '',
  status = '',
  startDate = '',
  endDate = '',
  uniquePromoters,
  uniqueSupervisors,
  uniqueOperations,
}: VisitsFiltersProps) => {
  return (
    <form method="GET" action="/dashboard/visitas" className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col gap-4 mb-6">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
        <Filter className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filtros Avançados</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-end">
        {/* Promotor */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-semibold">Promotor</label>
          <select
            name="promoter"
            defaultValue={promoter}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fadeIn"
          >
            <option value="">Todos</option>
            {uniquePromoters.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Supervisor */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-semibold">Supervisor</label>
          <select
            name="supervisor"
            defaultValue={supervisor}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {uniqueSupervisors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Operação */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-semibold">Operação</label>
          <select
            name="operation"
            defaultValue={operation}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {uniqueOperations.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-semibold">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="PLANEJADA">Planejada</option>
            <option value="REALIZADA">Realizada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        {/* Período Início */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-semibold">Início</label>
          <input
            type="date"
            name="startDate"
            defaultValue={startDate}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Período Fim */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-semibold">Fim</label>
          <input
            type="date"
            name="endDate"
            defaultValue={endDate}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <a
          href="/dashboard/visitas"
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-sm px-4 py-2 rounded-xl transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Limpar Filtros
        </a>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Aplicar Filtros
        </button>
      </div>
    </form>
  );
};
