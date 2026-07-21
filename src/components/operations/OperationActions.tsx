'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function OperationActions({ id, archived }: { id: string; archived: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function changeStatus() {
    if (!archived && !window.confirm('Arquivar esta operacao?')) return;
    setBusy(true); setError('');
    const response = await fetch(`/api/operations/${id}?action=${archived ? 'reopen' : 'archive'}`, { method: 'POST' });
    if (!response.ok) { const body = await response.json(); setError(body.error || 'Falha ao atualizar.'); setBusy(false); return; }
    router.refresh();
  }
  return <div className="flex flex-wrap items-center gap-2"><Link href={`/dashboard/operacoes/${id}/editar`} className="rounded-md border px-4 py-2.5 text-xs">Editar</Link><button disabled={busy} onClick={changeStatus} className="rounded-md bg-[#20201f] px-4 py-2.5 text-xs text-white disabled:opacity-50">{busy ? 'Atualizando...' : archived ? 'Reativar' : 'Arquivar'}</button>{error && <span className="text-xs text-red-700">{error}</span>}</div>;
}
