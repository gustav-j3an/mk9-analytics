'use client';

import { useMemo, useState } from 'react';
import type { NormalizedImportRow } from '../types/ImportPreview';
import { PREVIEW_ERRORS_COLUMN, PREVIEW_SOURCE_ROW_COLUMN, PREVIEW_STATUS_COLUMN } from '../types/ImportPreview';

interface PreviewTableProps {
  columns: string[];
  data: NormalizedImportRow[];
}

const PAGE_SIZES = [10, 25, 50, 'Todas'] as const;

export function isDatePreviewColumn(column: string): boolean {
  return /^\d{2}_\d{2}_\d{4}$/.test(column);
}

function stickyClass(column: string): string {
  if (column === PREVIEW_SOURCE_ROW_COLUMN) return 'sticky left-0 z-20 min-w-[72px] bg-inherit';
  if (column === 'LOJA') return 'sticky left-[72px] z-20 min-w-[220px] bg-inherit';
  if (column === 'UF') return 'sticky left-[292px] z-20 min-w-[64px] bg-inherit';
  if (column === PREVIEW_STATUS_COLUMN) return 'sticky left-[356px] z-20 min-w-[96px] bg-inherit';
  return '';
}

export const PreviewTable = ({ columns, data }: PreviewTableProps) => {
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [page, setPage] = useState(1);
  const displayColumns = useMemo(() => {
    const source = columns.length > 0 ? columns : Object.keys(data[0] ?? {});
    const sticky = [PREVIEW_SOURCE_ROW_COLUMN, 'LOJA', 'UF', PREVIEW_STATUS_COLUMN];
    return [...sticky.filter((column) => source.includes(column)), ...source.filter((column) => !sticky.includes(column) && column !== PREVIEW_ERRORS_COLUMN)];
  }, [columns, data]);

  if (!data || data.length === 0) return <div className="py-6 text-center text-sm text-[#858580]">Nenhum dado para exibir</div>;

  const numericSize = pageSize === 'Todas' ? data.length : pageSize;
  const totalPages = Math.max(1, Math.ceil(data.length / Math.max(1, numericSize)));
  const safePage = Math.min(page, totalPages);
  const visibleRows = pageSize === 'Todas' ? data : data.slice((safePage - 1) * numericSize, safePage * numericSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#52525B]">
        <div className="flex gap-4"><span><b className="text-green-700">✓</b> Visita detectada</span><span>– Sem visita</span><span><b className="text-amber-700">⚠</b> Linha inválida</span></div>
        <label className="flex items-center gap-2">Linhas por página
          <select value={pageSize} onChange={(event) => { const value = event.target.value; setPageSize(value === 'Todas' ? 'Todas' : Number(value) as 10 | 25 | 50); setPage(1); }} className="rounded-md border border-[#D4D4D8] bg-white px-2 py-1">
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      <div className="w-full max-w-full overflow-x-auto rounded-lg border border-[#E4E4E7]">
        <table className="min-w-max text-left text-xs text-[#666661]">
          <thead className="bg-[#F4F4F5]"><tr>{displayColumns.map((col) => <th key={col} className={`px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[#52525B] ${stickyClass(col)}`}>{col.replaceAll('_', ' ')}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#ECECE8]">
            {visibleRows.map((row, index) => {
              const invalid = row[PREVIEW_STATUS_COLUMN] === 'Inválida';
              return <tr key={`${String(row[PREVIEW_SOURCE_ROW_COLUMN])}-${index}`} title={invalid ? String(row[PREVIEW_ERRORS_COLUMN] || '') : undefined} className={invalid ? 'bg-amber-50/80' : 'bg-white hover:bg-[#FAFAF8]'}>
                {displayColumns.map((col) => {
                  const value = row[col];
                  const marked = isDatePreviewColumn(col) && value === '✓';
                  return <td key={col} className={`max-w-[260px] whitespace-nowrap px-3 py-2.5 text-center text-xs text-[#393937] ${stickyClass(col)}`}>
                    {col === PREVIEW_STATUS_COLUMN ? <span className="inline-flex max-w-[220px] flex-col items-center gap-1"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${invalid ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{String(value)}</span>{invalid && <span className="whitespace-normal text-[9px] leading-tight text-amber-900">{String(row[PREVIEW_ERRORS_COLUMN] || '')}</span>}</span> : marked ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 font-bold text-green-800" aria-label="Visita detectada">✓</span> : value !== null && value !== undefined && String(value) !== '' ? String(value) : '-'}
                  </td>;
                })}
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {pageSize !== 'Todas' && <div className="flex items-center justify-end gap-2 text-xs"><button disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border px-2 py-1 disabled:opacity-40">Anterior</button><span>{safePage} de {totalPages}</span><button disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded border px-2 py-1 disabled:opacity-40">Próxima</button></div>}
    </div>
  );
};
