'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  evidenceId: string;
  stores: Array<{ id: string; name: string }>;
  industries: Array<{ id: string; name: string }>;
  operations: Array<{ id: string; name: string }>;
  suggestedVisitId?: string;
  enabled: boolean;
}

export function ReconciliationActions(props: Props) {
  const router = useRouter();
  const [storeId, setStoreId] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [operationId, setOperationId] = useState('');
  const [evidenceDate, setEvidenceDate] = useState('');
  async function act(action: string, extra: Record<string, string> = {}) {
    const fields = Object.fromEntries(Object.entries(extra).filter((entry) => entry[1]));
    const response = await fetch('/api/reconciliation/' + props.evidenceId, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...fields }),
    });
    if (response.ok) router.refresh();
  }
  if (!props.enabled) return <small>Acoes bloqueadas sem autenticacao.</small>;
  return <div>
    <select value={storeId} onChange={(event) => setStoreId(event.target.value)}>
      <option value={''}>Loja canonica</option>
      {props.stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
    </select>
    <button onClick={() => act('SAVE_ALIAS', { storeId })}>Salvar alias</button>
    <select value={industryId} onChange={(event) => setIndustryId(event.target.value)}><option value={''}>Industria</option>{props.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <select value={operationId} onChange={(event) => setOperationId(event.target.value)}><option value={''}>Operacao</option>{props.operations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <input type={'date'} value={evidenceDate} onChange={(event) => setEvidenceDate(event.target.value)}></input>
    <button onClick={() => act('CORRECT', { industryId, operationId, evidenceDate })}>Corrigir e reprocessar</button>
    <button onClick={() => act('REPROCESS')}>Reprocessar</button>
    <button onClick={() => act('UNPLANNED')}>Fora do roteiro</button>
    {props.suggestedVisitId ? <button onClick={() => act('LINK', { visitId: props.suggestedVisitId ?? '' })}>Vincular sugestao</button> : null}
  </div>;
}
