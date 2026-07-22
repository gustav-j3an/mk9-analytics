import { PageHeader } from '@/components/ui/PageHeader';
import { ReconciliationDashboardRepository } from './ReconciliationDashboardRepository';
import { ReconciliationActions } from './ReconciliationActions';

type Data = Awaited<ReturnType<typeof ReconciliationDashboardRepository.getData>>;

function EvidenceRows({ data }: { data: Data }) {
  return <tbody>{data.evidences.map((item) => <tr key={item.id}>
    <td>{item.evidenceDate.toISOString().slice(0, 10)}</td>
    <td>{item.rawStoreName}</td>
    <td>{item.rawBrand}</td>
    <td>{item.rawCity}</td>
    <td>{item.rawState}</td>
    <td>{item.visit?.promoter.name}</td>
    <td>{item.result}</td>
    <td>{JSON.stringify(item.diagnostics)}</td>
    <td>{JSON.stringify(item.suggestion)}</td>
    <td><ReconciliationActions evidenceId={item.id} stores={data.options.stores} industries={data.options.industries} operations={data.options.operations} suggestedVisitId={(item.suggestion as { visitId?: string } | null)?.visitId} enabled={process.env.NODE_ENV === 'development'} /></td>
  </tr>)}</tbody>;
}

function Filters({ data }: { data: Data }) {
  return <form>
    <select name={'operation'}><option value={''}>Operacao</option>{data.options.operations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <select name={'promoter'}><option value={''}>Promotor</option>{data.options.promoters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <select name={'industry'}><option value={''}>Industria</option>{data.options.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <input name={'from'} type={'date'}></input><input name={'to'} type={'date'}></input><input name={'state'} placeholder={'UF'}></input>
    <button>Filtrar</button>
  </form>;
}

export function ReconciliationDashboardView({ data }: { data: Data }) {
  const cards = [
    ['Planejadas', data.metrics.planned],
    ['Evidencias', data.metrics.evidence],
    ['Conciliadas', data.metrics.matched],
    ['Fora do roteiro', data.metrics.unplanned],
    ['Data divergente', data.metrics.dateMismatch],
    ['Ambiguas', data.metrics.ambiguous],
    ['Lojas nao identificadas', data.metrics.storesNotFound],
    ['Pendentes', data.metrics.pending],
  ];
  return <main>
    {PageHeader({ category: 'Operacao', title: 'Conciliacao', subtitle: 'Pendencias e sugestoes.' })}
    {cards.map(([label, value]) => <p key={String(label)}>{label}: {value}</p>)}
    {Filters({ data })}
    <table>{EvidenceRows({ data })}</table>
  </main>;
}
