import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDatePtBr } from '@/lib/formatters';
import type { OperationItem, OperationsPagination } from '@/modules/operations/dashboard/operations-dashboard.types';

type Props = { operations: OperationItem[]; pagination: OperationsPagination; query: Record<string, string> };
const statusLabels: Record<string, string> = { PLANNING: 'Planejada', OPEN: 'Ativa', IN_PROGRESS: 'Ativa', FINISHED: 'Finalizada', CANCELLED: 'Cancelada', ARCHIVED: 'Arquivada' };

function href(page: number, p: OperationsPagination, query: Record<string, string>) {
  const params = new URLSearchParams({ ...query, page: String(page), pageSize: String(p.pageSize) });
  for (const [key, value] of Object.entries(query)) if (!value) params.delete(key);
  return `/dashboard/operacoes?${params}`;
}

export function OperationsTable({ operations, pagination: p, query }: Props) {
  if (!operations.length) return <EmptyState title="Nenhuma operacao encontrada" description="Ajuste os filtros ou cadastre uma operacao." />;
  return <section className="overflow-hidden rounded-md border bg-white">
    <div className="overflow-x-auto"><table className="min-w-[1500px] w-full text-left text-xs">
      <thead><tr className="border-b text-[#74746f]"><Th>Operacao</Th><Th>Cliente</Th><Th>Industrias</Th><Th>Supervisor</Th><Th>Inicio</Th><Th>Termino</Th><Th>Status</Th><Th>Lojas</Th><Th>Promotores</Th><Th>Planejadas</Th><Th>Realizadas</Th><Th>Acoes</Th></tr></thead>
      <tbody className="divide-y">{operations.map((item) => <tr key={item.id} className="hover:bg-[#fafaf8]">
        <Td><Link href={`/dashboard/operacoes/${item.id}`} className="font-semibold hover:underline">{item.name}</Link></Td>
        <Td>{item.clientId || '-'}</Td><Td>{item.industries.join(', ') || '-'}</Td><Td>{item.supervisorNames.join(', ') || '-'}</Td>
        <Td>{formatDatePtBr(item.startsAt)}</Td><Td>{formatDatePtBr(item.endsAt)}</Td><Td>{statusLabels[item.status]}</Td>
        <Td>{item.storesCount}</Td><Td>{item.promotersCount}</Td><Td>{item.visitsPlannedCount}</Td><Td>{item.visitsExecutedCount}</Td>
        <Td><Link className="mr-3 hover:underline" href={`/dashboard/operacoes/${item.id}`}>Abrir</Link><Link className="hover:underline" href={`/dashboard/operacoes/${item.id}/editar`}>Editar</Link></Td>
      </tr>)}</tbody>
    </table></div>
    <div className="flex items-center justify-between border-t px-4 py-3 text-xs"><span>{p.total} registro(s) - Pagina {p.page} de {p.totalPages}</span><div className="flex gap-2">{p.page > 1 && <Link className="rounded border px-3 py-1.5" href={href(p.page - 1, p, query)}>Anterior</Link>}{p.page < p.totalPages && <Link className="rounded border px-3 py-1.5" href={href(p.page + 1, p, query)}>Proxima</Link>}</div></div>
  </section>;
}

function Th({ children }: { children: React.ReactNode }) { return <th className="whitespace-nowrap px-4 py-3">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="max-w-[220px] truncate px-4 py-3">{children}</td>; }
