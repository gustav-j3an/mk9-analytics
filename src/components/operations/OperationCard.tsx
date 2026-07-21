import type { OperationsStatsData } from '@/modules/operations/dashboard/operations-dashboard.types';

export function OperationCard({ stats }: { stats: OperationsStatsData }) {
  const items = [['Total', stats.totalCount], ['Planejadas', stats.planningCount], ['Ativas', stats.activeCount], ['Finalizadas', stats.finishedCount], ['Arquivadas', stats.archivedCount]] as const;
  return <section className="grid overflow-hidden rounded-md border bg-white sm:grid-cols-2 xl:grid-cols-5">{items.map(([label, value]) => <div key={label} className="border-b border-r p-4"><p className="text-[11px] text-[#73736f]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</section>;
}
