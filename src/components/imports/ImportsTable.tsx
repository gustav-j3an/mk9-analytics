import { EmptyState } from '@/components/ui/EmptyState';
import { formatDatePtBr } from '@/lib/formatters';
import type { ImportItem } from '@/modules/imports/dashboard/imports-dashboard.types';
import { ImportStatusBadge } from './ImportStatusBadge';

export function ImportsTable({ imports }: { imports: ImportItem[] }) {
  if (imports.length === 0) return <EmptyState title="Nenhuma importação registrada" description="Use “Nova importação” para processar o primeiro arquivo." />;
  return <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-[#deded9] bg-white"><div className="w-full overflow-x-auto"><table className="w-full min-w-[980px] table-fixed text-left text-xs"><thead><tr className="border-b border-[#e7e7e3] text-[#74746f]"><Th>Data</Th><Th>Arquivo</Th><Th>Operação</Th><Th>Status</Th><Th>Total</Th><Th>Válidas</Th><Th>Inválidas</Th><Th>Duplicadas</Th><Th>Confirmação</Th></tr></thead><tbody className="divide-y divide-[#ecece8]">{imports.map((item) => <tr key={item.id} className="hover:bg-[#fafaf8]"><Td>{formatDatePtBr(item.createdAt, true)}</Td><Td strong title={item.nomeArquivo}>{item.nomeArquivo && item.nomeArquivo !== 'N/A' ? item.nomeArquivo : 'Arquivo não identificado'}</Td><Td title={item.operationName ?? undefined}>{item.operationName ?? 'Sem vínculo'}</Td><Td><ImportStatusBadge status={item.status} /></Td><Td>{item.totalRows || '—'}</Td><Td success>{item.validRows || '—'}</Td><Td problem>{item.invalidRows || '—'}</Td><Td>{item.duplicateRows || '—'}</Td><Td>{formatDatePtBr(item.confirmedAt, true)}</Td></tr>)}</tbody></table></div></section>;
}
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <th className={`px-3 py-3 font-medium first:pl-4 last:pr-4 ${className}`}>{children}</th>; }
function Td({ children, strong = false, success = false, problem = false, title }: { children: React.ReactNode; strong?: boolean; success?: boolean; problem?: boolean; title?: string }) { return <td title={title} className={`truncate px-3 py-3.5 first:pl-4 last:pr-4 ${strong ? 'font-medium text-[#292928]' : success ? 'font-medium text-[#2f7445]' : problem ? 'font-medium text-[#a53737]' : 'text-[#666661]'}`}>{children}</td>; }
export default ImportsTable;
