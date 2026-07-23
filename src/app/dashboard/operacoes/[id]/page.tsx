import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Activity, Archive, CalendarDays, CheckCircle2, ClipboardCheck, Factory, FileSpreadsheet, MapPin, Route, Users } from 'lucide-react';
import { DetailTabs, type DetailTab } from '@/components/details/DetailTabs';
import { OperationActions } from '@/components/operations/OperationActions';
import { operationService } from '@/modules/operations/services/OperationService';
import { formatDatePtBr } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function OperacaoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let operation;
  try { operation = await operationService.getManagementDetail(id); } catch { notFound(); }
  const stores = [...new Map(operation.visits.map((visit) => [visit.store.id, visit.store])).values()];
  const promoters = [...new Map([...operation.promoters, ...operation.visits.map((visit) => visit.promoter)].map((item) => [item.id, item])).values()];
  const industries = [...new Map(operation.visits.map((visit) => [visit.industry.id, visit.industry])).values()];
  const supervisors = [...new Set(promoters.map((item) => item.supervisor.name))];
  const realized = operation.visits.filter((visit) => visit.status === 'REALIZADA').length;
  const pending = operation.visits.filter((visit) => visit.status === 'PLANEJADA').length;
  const matched = operation.evidences.filter((item) => item.result === 'MATCHED').length;
  const coverage = operation.visits.length ? Math.round(realized / operation.visits.length * 100) : 0;
  const lastImport = operation.imports[0];
  const history = [
    { id: `created-${id}`, date: operation.createdAt, title: 'Operação criada', meta: operation.name },
    { id: `updated-${id}`, date: operation.updatedAt, title: 'Última atualização', meta: operation.status },
    ...operation.imports.map((item) => ({ id: `import-${item.id}`, date: item.createdAt, title: 'Importação', meta: item.files[0]?.fileName || 'Arquivo não identificado' })),
    ...operation.evidences.flatMap((item) => item.audits.map((audit) => ({ id: `audit-${audit.id}`, date: audit.createdAt, title: 'Conciliação', meta: audit.action }))),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const tabs: DetailTab[] = [
    { id: 'summary', label: 'Resumo', content: <Summary operation={operation} stores={stores.length} promoters={promoters.length} industries={industries.length} realized={realized} pending={pending} matched={matched} coverage={coverage} lastImport={lastImport?.createdAt} /> },
    { id: 'stores', label: 'Lojas', count: stores.length, content: <Table headers={['Loja', 'Rede', 'Cidade', 'UF']} rows={stores.map((item) => [item.name, item.chain || '—', item.city || '—', item.state || '—'])} /> },
    { id: 'promoters', label: 'Promotores', count: promoters.length, content: <Table headers={['Promotor', 'Supervisor', 'Cidade', 'UF']} rows={promoters.map((item) => [item.name, item.supervisor.name, item.city || '—', item.state || '—'])} /> },
    { id: 'industries', label: 'Indústrias', count: industries.length, content: <Table headers={['Indústria', 'Código', 'Frequência']} rows={industries.map((item) => [item.name, item.code, String(item.contractedFrequency ?? 'Não informada')])} /> },
    { id: 'routes', label: 'Roteiros', count: operation.visits.length, content: <Table headers={['Data', 'Loja', 'Promotor', 'Indústria']} rows={operation.visits.map((item) => [formatDatePtBr(item.scheduledDate), item.store.name, item.promoter.name, item.industry.name])} /> },
    { id: 'visits', label: 'Visitas', count: operation.visits.length, content: <Table headers={['Data', 'Loja', 'Indústria', 'Promotor', 'Status']} rows={operation.visits.map((item) => [formatDatePtBr(item.scheduledDate), item.store.name, item.industry.name, item.promoter.name, item.status])} /> },
    { id: 'imports', label: 'Importações', count: operation.imports.length, content: <Table headers={['Data', 'Arquivo', 'Status', 'Confirmação']} rows={operation.imports.map((item) => [formatDatePtBr(item.createdAt, true), item.files[0]?.fileName || 'Arquivo não identificado', item.status, item.confirmations[0] ? formatDatePtBr(item.confirmations[0].confirmedAt, true) : '—'])} /> },
    { id: 'reconciliation', label: 'Conciliação', count: operation.evidences.length, content: <Table headers={['Data', 'Arquivo', 'Loja', 'Indústria', 'Resultado']} rows={operation.evidences.map((item) => [formatDatePtBr(item.evidenceDate), item.sourceFile, item.store?.name || item.rawStoreName, item.industry?.name || item.rawIndustryName, item.result])} /> },
    { id: 'history', label: 'Histórico', count: history.length, content: <div className="divide-y divide-[var(--mk-border)]">{history.map((item) => <div key={item.id} className="flex gap-3 py-3"><span className="mt-1 h-2 w-2 rounded-full bg-[var(--mk-primary)]" /><div><p className="text-xs font-semibold">{item.title}</p><p className="text-[10px] text-[var(--mk-text-subtle)]">{item.meta} · {formatDatePtBr(item.date, true)}</p></div></div>)}</div> },
  ];

  return <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-7 sm:px-6 lg:px-8">
    <header className="flex flex-col gap-4 border-b border-[var(--mk-border)] pb-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><Link href="/dashboard/operacoes" className="text-[10px] font-bold uppercase tracking-wider text-[var(--mk-primary)]">Operações</Link><div className="mt-2 flex flex-wrap items-center gap-2"><h1 className="truncate text-xl font-bold">{operation.name}</h1><span className={`mk-status ${operation.status === 'ARCHIVED' ? 'mk-status-danger' : 'mk-status-info'}`}>{operation.status}</span></div><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--mk-text-subtle)]"><span>{operation.clientId || 'Cliente não informado'}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDatePtBr(operation.startsAt)} — {formatDatePtBr(operation.endsAt)}</span><span>Responsável: {supervisors.join(', ') || 'Não definido'}</span></div>{operation.description && <p className="mt-3 max-w-3xl text-xs leading-5 text-[var(--mk-text-secondary)]">{operation.description}</p>}</div><OperationActions id={id} name={operation.name} archived={operation.status === 'ARCHIVED'} /></header>
    <section className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8"><Metric icon={MapPin} label="Lojas" value={stores.length} /><Metric icon={Users} label="Promotores" value={promoters.length} /><Metric icon={Factory} label="Indústrias" value={industries.length} /><Metric icon={Route} label="Visitas" value={operation.visits.length} /><Metric icon={FileSpreadsheet} label="Importações" value={operation.imports.length} /><Metric icon={ClipboardCheck} label="Conciliações" value={matched} /><Metric icon={CheckCircle2} label="Cobertura" value={`${coverage}%`} /><Metric icon={Activity} label="Pendências" value={pending} /></section>
    <DetailTabs tabs={tabs} />
  </main>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Archive; label: string; value: string | number }) { return <div className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-card)] p-3"><Icon className="h-3.5 w-3.5 text-[var(--mk-primary)]" /><p className="mt-2 mk-label">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>; }
function Summary({ operation, stores, promoters, industries, realized, pending, matched, coverage, lastImport }: { operation: { imports: unknown[]; evidences: unknown[]; updatedAt: Date }; stores: number; promoters: number; industries: number; realized: number; pending: number; matched: number; coverage: number; lastImport?: Date }) { const values = [['Lojas', stores], ['Promotores', promoters], ['Indústrias', industries], ['Visitas', realized + pending], ['Importações', operation.imports.length], ['Conciliações', matched], ['Última importação', lastImport ? formatDatePtBr(lastImport, true) : '—'], ['Última atualização', formatDatePtBr(operation.updatedAt, true)]] as const; return <div className="space-y-5"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{values.map(([label, value]) => <div key={label} className="rounded-xl border p-3"><p className="mk-label">{label}</p><p className="mt-1 text-base font-bold">{value}</p></div>)}</div><div className="grid gap-3 md:grid-cols-2"><MiniBar label="Cobertura de visitas" value={coverage} /><MiniBar label="Conciliações concluídas" value={operation.evidences.length ? Math.round(matched / operation.evidences.length * 100) : 0} /></div></div>; }
function MiniBar({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-[var(--mk-bg-secondary)] p-4"><div className="flex justify-between text-xs"><span className="font-semibold">{label}</span><strong>{value}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--mk-border)]"><div className="h-full rounded-full bg-[var(--mk-primary)]" style={{ width: `${Math.min(100, value)}%` }} /></div></div>; }
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) { if (!rows.length) return <p className="py-10 text-center text-xs text-[var(--mk-text-subtle)]">Nenhum registro vinculado.</p>; return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b">{headers.map((item) => <th key={item} className="px-3 py-3">{item}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr key={index} className="hover:bg-[var(--mk-hover)]">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3">{cell}</td>)}</tr>)}</tbody></table></div>; }
