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
      className={`filter-bar rounded-2xl border p-4 flex flex-col gap-4 mb-6 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-[#3B3E45]">
        <Filter className="w-4 h-4 text-green-600 dark:text-[#6BCB70]" />
        <span className="text-xs font-bold text-gray-700 dark:text-[#F5F5F5] uppercase tracking-wider">Filtros</span>
      </div>

      <div className="flex-1 flex flex-wrap gap-4 items-end">
        {children}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {clearUrl && (
          <a
            href={clearUrl}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-[#32353A] dark:hover:bg-[#3B3E45] dark:text-[#C7C7C7] font-medium text-sm px-4 py-2 rounded-xl transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Limpar
          </a>
        )}
        <button
          type="submit"
          className="standard-button"
        >
          Filtrar
        </button>
      </div>
    </form>
  );
};
