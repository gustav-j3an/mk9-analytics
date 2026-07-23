'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Copy, Eraser, MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { canConfirmOperationDeletion } from '@/modules/operations/services/OperationLifecycleService';

type Impact = { stores: number; promoters: number; industries: number; visits: number; imports: number; reconciliations: number; evidences: number; routes: number };
type CleanupSelection = { routes: boolean; visits: boolean; evidences: boolean; reconciliations: boolean; imports: boolean };
type CleanupPreview = {
  removable: { routes: number; visits: number; evidences: number; reconciliations: number; imports: number; files: number; previews: number; confirmations: number };
  preserved: { stores: number; promoters: number; industries: number };
  unsafeReasons: string[];
};
const emptySelection: CleanupSelection = { routes: false, visits: false, evidences: false, reconciliations: false, imports: false };

export function OperationActions({ id, name, archived }: { id: string; name: string; archived: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [preview, setPreview] = useState<{ canDelete: boolean; impact: Impact } | null>(null);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
  const [selection, setSelection] = useState<CleanupSelection>(emptySelection);

  async function action(kind: 'archive' | 'reopen' | 'duplicate') {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/operations/${id}?action=${kind}`, { method: 'POST' });
      const body = await response.json() as { error?: string; id?: string };
      if (!response.ok) throw new Error(body.error || 'Falha ao atualizar a operação.');
      toast.success(kind === 'duplicate' ? 'Operação duplicada sem dados operacionais.' : kind === 'archive' ? 'Operação arquivada.' : 'Operação restaurada.');
      if (kind === 'duplicate' && body.id) router.push(`/dashboard/operacoes/${body.id}`);
      else router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao atualizar a operação.'); }
    finally { setBusy(false); }
  }

  async function openDelete() {
    setDeleteOpen(true); setConfirmation(''); setPreview(null); setBusy(true);
    try {
      const response = await fetch(`/api/operations/${id}`, { method: 'OPTIONS' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível analisar a operação.');
      setPreview(body);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível analisar a operação.'); setDeleteOpen(false); }
    finally { setBusy(false); }
  }

  async function openCleanup() {
    setCleanupOpen(true); setCleanupPreview(null); setSelection(emptySelection); setBusy(true);
    try {
      const response = await fetch(`/api/operations/${id}/cleanup`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível simular a limpeza.');
      setCleanupPreview(body);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível simular a limpeza.'); setCleanupOpen(false); }
    finally { setBusy(false); }
  }

  async function clean() {
    if (!cleanupPreview || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/operations/${id}/cleanup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(selection) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível limpar a operação.');
      toast.success('Limpeza concluída. Os cadastros foram preservados.');
      setCleanupOpen(false);
      setPreview(null);
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível limpar a operação.'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!canConfirmOperationDeletion(Boolean(preview?.canDelete), confirmation) || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/operations/${id}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmation }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível excluir a operação.');
      toast.success('Operação excluída.');
      router.push('/dashboard/operacoes');
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a operação.'); }
    finally { setBusy(false); }
  }

  return <>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" loading={busy}><MoreHorizontal />Ações</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52">
      <DropdownMenuItem asChild><Link href={`/dashboard/operacoes/${id}/editar`}><Pencil />Editar</Link></DropdownMenuItem>
      <DropdownMenuItem onSelect={() => void action('duplicate')}><Copy />Duplicar</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => void action(archived ? 'reopen' : 'archive')}>{archived ? <RotateCcw /> : <Archive />}{archived ? 'Restaurar' : 'Arquivar'}</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => void openCleanup()}><Eraser />Limpar operação</DropdownMenuItem>
      <DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => void openDelete()}><Trash2 />Excluir</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
    {cleanupOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button aria-label="Fechar" className="fixed inset-0 bg-black/60" onClick={() => !busy && setCleanupOpen(false)} /><div role="dialog" aria-modal="true" aria-label="Limpar operação" className="mk-dialog relative z-10 w-full max-w-2xl space-y-5 rounded-2xl border p-6">
      <div><h3 className="text-base font-bold">Limpar operação</h3><p className="mt-1 text-xs text-[var(--mk-text-secondary)]">Selecione os dados que serão removidos de <strong>{name}</strong>. A execução é transacional.</p></div>
      {!cleanupPreview ? <p className="py-8 text-center text-xs">Analisando todos os vínculos...</p> : <>
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            ['routes', 'Roteiros', 'Visitas planejadas da operação'],
            ['visits', 'Visitas executadas', 'Visitas realizadas ou canceladas'],
            ['evidences', 'Evidências', 'Checklists e evidências importadas'],
            ['reconciliations', 'Conciliações', 'Auditorias de conciliação'],
            ['imports', 'Importações', `${cleanupPreview.removable.files} arquivo(s), ${cleanupPreview.removable.previews} preview(s)`],
          ] as const).map(([key, label, description]) => <label key={key} className={`flex items-start gap-3 rounded-xl border p-3 ${cleanupPreview.removable[key] ? 'cursor-pointer hover:bg-[var(--mk-hover)]' : 'opacity-50'}`}><input type="checkbox" className="mt-1" checked={selection[key]} disabled={!cleanupPreview.removable[key]} onChange={(event) => setSelection((current) => ({ ...current, [key]: event.target.checked }))} /><span className="min-w-0 flex-1"><span className="flex justify-between gap-3 text-xs font-semibold"><span>{label}</span><strong>{cleanupPreview.removable[key]}</strong></span><span className="mt-1 block text-[10px] text-[var(--mk-text-subtle)]">{description}</span></span></label>)}
        </div>
        {selection.imports && !selection.evidences && cleanupPreview.removable.evidences > 0 && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">Para remover importações, selecione também as evidências vinculadas.</div>}
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900"><strong>Cadastros preservados:</strong> {cleanupPreview.preserved.stores} loja(s), {cleanupPreview.preserved.promoters} promotor(es) e {cleanupPreview.preserved.industries} indústria(s). Promotores diretamente vinculados serão apenas desvinculados.</div>
      </>}
      <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setCleanupOpen(false)}>Cancelar</Button><Button variant="destructive" loading={busy} disabled={!cleanupPreview || (selection.imports && !selection.evidences && cleanupPreview.removable.evidences > 0) || (!Object.values(selection).some(Boolean) && cleanupPreview.preserved.promoters === 0)} onClick={() => void clean()}>Executar limpeza</Button></div>
    </div></div>}
    {deleteOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button aria-label="Fechar" className="fixed inset-0 bg-black/60" onClick={() => !busy && setDeleteOpen(false)} /><div role="dialog" aria-modal="true" className="mk-dialog relative z-10 w-full max-w-xl space-y-5 rounded-2xl border p-6">
      <div><h3 className="text-base font-bold">Excluir operação?</h3><p className="mt-1 text-xs text-[var(--mk-text-secondary)]">{name}</p></div>
      {!preview ? <p className="py-6 text-center text-xs">Analisando vínculos...</p> : <>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries({ Lojas: preview.impact.stores, Promotores: preview.impact.promoters, Indústrias: preview.impact.industries, Visitas: preview.impact.visits, Importações: preview.impact.imports, Conciliações: preview.impact.reconciliations, Evidências: preview.impact.evidences, Roteiros: preview.impact.routes }).map(([label, value]) => <div key={label} className="rounded-xl border p-3"><p className="mk-label">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}</div>
        {!preview.canDelete ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900">Esta operação possui dados vinculados.<br />Arquive ou utilize a função de limpeza antes da exclusão.</div> : <label className="block space-y-2 text-xs font-medium">Digite <strong>EXCLUIR OPERAÇÃO</strong><input autoFocus className="h-10 w-full rounded-xl border px-3" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>}
      </>}
      <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="destructive" loading={busy} disabled={!canConfirmOperationDeletion(Boolean(preview?.canDelete), confirmation)} onClick={() => void remove()}>Excluir operação</Button></div>
    </div></div>}
  </>;
}
