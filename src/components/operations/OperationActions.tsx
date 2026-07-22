'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';

export function OperationActions({ id, archived }: { id: string; archived: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  async function changeStatus() {
    setConfirming(false); setBusy(true);
    try {
      const response = await fetch(`/api/operations/${id}?action=${archived ? 'reopen' : 'archive'}`, { method: 'POST' });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || 'Falha ao atualizar a operação.'); }
      toast.success(archived ? 'Operação reativada.' : 'Operação arquivada.');
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao atualizar a operação.'); }
    finally { setBusy(false); }
  }
  return <>
    <div className="flex flex-wrap items-center gap-2"><Link href={`/dashboard/operacoes/${id}/editar`} className="standard-button">Editar</Link><Button disabled={busy} variant={archived ? 'default' : 'destructive'} onClick={() => archived ? void changeStatus() : setConfirming(true)}>{busy ? 'Atualizando...' : archived ? 'Reativar' : 'Arquivar'}</Button></div>
    <ConfirmDialog isOpen={confirming} title="Arquivar operação?" description="A operação deixará de aparecer entre as ativas, mas seus dados serão preservados." confirmLabel="Arquivar" danger onCancel={() => setConfirming(false)} onConfirm={() => void changeStatus()} />
  </>;
}