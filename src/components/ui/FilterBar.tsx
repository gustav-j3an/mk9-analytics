import React from 'react';
import { Filter } from 'lucide-react';

interface FilterBarProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  clearUrl?: string;
}

export const FilterBar = ({ children, clearUrl = '', className = '', ...props }: FilterBarProps) => {
  return (
    <form
      method="GET"
      className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col gap-4 mb-6 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
        <Filter className="w-4 h-4 text-green-600" />
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filtros</span>
      </div>

      <div className="flex-1 flex flex-wrap gap-4 items-end">
        {children}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {clearUrl && (
          <a
            href={clearUrl}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-sm px-4 py-2 rounded-xl transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Limpar
          </a>
        )}
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-5 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Filtrar
        </button>
      </div>
    </form>
  );
};
