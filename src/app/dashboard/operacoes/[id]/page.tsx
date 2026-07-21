import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { OperationActions } from '@/components/operations/OperationActions';
import { operationService } from '@/modules/operations/services/OperationService';
import { formatDatePtBr } from '@/lib/formatters';

const tabs = [['resumo', 'Resumo'], ['lojas', 'Lojas'], ['promotores', 'Promotores'], ['visitas', 'Visitas'], ['importacoes', 'Importacoes']] as const;

export default async function OperacaoDetalhesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const tab = (await searchParams).tab || 'resumo';
  let operation;
  try { operation = await operationService.getManagementDetail(id); } catch { notFound(); }
  const stores = [...new Map(operation.visits.map((visit) => [visit.store.id, visit.store])).values()];
  const promoters = [...new Map(operation.visits.map((visit) => [visit.promoter.id, visit.promoter])).values()];
  const industries = [...new Set(operation.visits.map((visit) => visit.industry.name))];
  const supervisors = [...new Set(operation.visits.map((visit) => visit.promoter.supervisor.name))];
  const realized = operation.visits.filter((visit) => visit.status === 'REALIZADA').length;
  return <main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader category="Operacoes" title={operation.name} subtitle={`${operation.clientId || 'Cliente nao informado'} - ${formatDatePtBr(operation.startsAt)} a ${formatDatePtBr(operation.endsAt)}`} actions={<OperationActions id={id} archived={operation.status === 'ARCHIVED'} />} />
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Card label="Lojas" value={stores.length} /><Card label="Promotores" value={promoters.length} /><Card label="Visitas planejadas" value={operation.visits.length} /><Card label="Visitas realizadas" value={realized} /></section>
    <nav className="flex gap-1 overflow-x-auto border-b">{tabs.map(([key, label]) => <Link key={key} href={`/dashboard/operacoes/${id}?tab=${key}`} className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium ${tab === key ? 'border-[#20201f] text-[#20201f]' : 'border-transparent text-[#73736f]'}`}>{label}</Link>)}</nav>
    {tab === 'resumo' && <section className="grid gap-4 rounded-md border bg-white p-5 md:grid-cols-2"><Info label="Status" value={operation.status} /><Info label="Cliente" value={operation.clientId || '-'} /><Info label="Industrias" value={industries.join(', ') || '-'} /><Info label="Supervisores" value={supervisors.join(', ') || '-'} /><Info label="Descricao" value={operation.description || '-'} /><Info label="Observacoes" value={operation.observations || '-'} /></section>}
    {tab === 'lojas' && <SimpleTable headers={['Loja', 'Rede', 'Cidade', 'UF']} rows={stores.map((store) => [store.name, store.chain || '-', store.city || '-', store.state || '-'])} />}
    {tab === 'promotores' && <SimpleTable headers={['Promotor', 'Supervisor', 'Cidade', 'UF']} rows={promoters.map((promoter) => [promoter.name, promoter.supervisor.name, promoter.city || '-', promoter.state || '-'])} />}
    {tab === 'visitas' && <SimpleTable headers={['Data', 'Loja', 'Industria', 'Promotor', 'Status']} rows={operation.visits.map((visit) => [formatDatePtBr(visit.scheduledDate), visit.store.name, visit.industry.name, visit.promoter.name, visit.status])} />}
    {tab === 'importacoes' && <section className="rounded-md border bg-white p-6"><h2 className="text-sm font-semibold">Importacoes da operacao</h2><p className="mt-2 text-sm text-[#73736f]">O banco atual nao possui vinculo entre importacoes e operacoes. Nenhum registro e associado por inferencia.</p></section>}
  </main>;
}

function Card({ label, value }: { label: string; value: number }) { return <div className="rounded-md border bg-white p-4"><p className="text-xs text-[#73736f]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-[#73736f]">{label}</p><p className="mt-1 text-sm">{value}</p></div>; }
function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) { return <div className="overflow-x-auto rounded-md border bg-white"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b">{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="p-6 text-sm text-[#73736f]">Nenhum registro vinculado.</p>}</div>; }
