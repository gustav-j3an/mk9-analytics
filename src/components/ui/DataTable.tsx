import React from 'react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { Pagination } from './Pagination';

interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Não existem dados correspondentes a essa consulta.',
  pagination,
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingState />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="standard-table overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              {columns.map((col, idx) => {
                const alignStyles = {
                  left: 'text-left',
                  right: 'text-right',
                  center: 'text-center',
                };
                return (
                  <th
                    key={idx}
                    className={`px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] dark:text-[#C7C7C7] ${
                      alignStyles[col.align || 'left']
                    }`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="transition-colors duration-150">
                {columns.map((col, colIdx) => {
                  const alignStyles = {
                    left: 'text-left',
                    right: 'text-right',
                    center: 'text-center',
                  };
                  return (
                    <td
                      key={colIdx}
                      className={`px-5 py-3.5 text-xs font-semibold text-[#3F3F46] dark:text-[#E7E7E7] whitespace-nowrap ${
                        alignStyles[col.align || 'left']
                      }`}
                    >
                      {col.render(row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="px-5 py-3.5 border-t">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;
