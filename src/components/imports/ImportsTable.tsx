'use client';

import { useMemo, useState } from 'react';
import { Eye, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDatePtBr } from '@/lib/formatters';
import type { ImportItem } from '@/modules/imports/dashboard/imports-dashboard.types';
import { ImportStatusBadge } from './ImportStatusBadge';

export function ImportsTable({ imports: initialImports }: { imports: ImportItem[] }) {
  const [imports, setImports] = useState(initialImports);
  const [selected, setSelected] = useState<ImportItem | null>(null);
  const [mode, setMode] = useState<'details' | 'delete' | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const idempotencyKey = useMemo(() => selected ? crypto.randomUUID() : '', [selected]);

  const close = () => {
    if (loading) return;
    setSelected(null);
    setMode(null);
    setConfirmation('');
  };
  const open = (item: ImportItem, nextMode: 'details' | 'delete') => {
    setSelected(item);
    setMode(nextMode);
    setConfirmation('');
  };
  const remove = async () => {
    if (!selected || confirmation !== 'EXCLUIR' || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/imports/${selected.id}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmation, idempotencyKey }),
      });
      const payload = await response.json() as { code?: string; error?: string };
      if (!response.ok) {
        const messages: Record<string, string> = {
          IMPORT_NOT_FOUND: 'Esta importação já não existe.',
          IMPORT_DELETE_FORBIDDEN: 'Você não tem permissão para excluir importações.',
          ADMIN_AUTH_REQUIRED: 'É necessário acesso de administrador.',
          IMPORT_PROCESSING_ACTIVE: 'A importação ainda está sendo processada. Aguarde a conclusão.',
          IMPORT_DELETE_FAILED: 'Não foi possível excluir a importação. Tente novamente.',
        };
        throw new Error((payload.code && messages[payload.code]) || payload.error || 'Não foi possível excluir a importação.');
      }
      setImports((current) => current.filter((item) => item.id !== selected.id));
      toast.success('Registro da importação excluído. Os dados operacionais foram preservados.');
      setSelected(null);
      setMode(null);
      setConfirmation('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a importação.');
    } finally {
      setLoading(false);
    }
  };

  if (!imports.length) {
    return <EmptyState title="Nenhuma importação registrada" description="Use “Nova importação” para processar o primeiro arquivo." />;
  }
  return <>
    <section className="mk-panel min-w-0 max-w-full overflow-hidden">
      <div className="border-b border-[var(--mk-border)] px-5 py-4">
        <h2 className="text-sm font-bold">Histórico de importações</h2>
        <p className="mt-1 text-xs text-[var(--mk-text-subtle)]">Arquivos processados e resultado da validação</p>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1120px] table-fixed text-left text-xs">
          <thead><tr>{['Arquivo', 'Layout', 'Operação', 'Data', 'Status', 'Linhas', 'Visitas', 'Usuário', ''].map((x) => <Th key={x}>{x}</Th>)}</tr></thead>
          <tbody className="divide-y divide-[var(--mk-border)]">{imports.map((item) => <tr key={item.id}>
            <Td strong title={item.nomeArquivo}>{item.nomeArquivo}</Td><Td title={item.layout}>{item.layout}</Td>
            <Td title={item.operationName ?? undefined}>{item.operationName ?? 'Sem vínculo'}</Td>
            <Td>{formatDatePtBr(item.createdAt, true)}</Td><Td><ImportStatusBadge status={item.status} /></Td>
            <Td>{item.totalRows || '—'}</Td><Td>{item.visits || '—'}</Td><Td>{item.userName}</Td>
            <td className="px-3 py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Ações de ${item.nomeArquivo}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onSelect={() => open(item, 'details')}><Eye />Ver detalhes</DropdownMenuItem>
                <DropdownMenuItem disabled><RotateCcw />Reprocessar (indisponível)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => open(item, 'delete')}><Trash2 />Excluir registro da importação</DropdownMenuItem>
                <DropdownMenuItem disabled title="Os registros não possuem rastreabilidade exclusiva"><RotateCcw />Desfazer dados (inseguro)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    {selected && mode && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fechar modal" className="fixed inset-0 bg-black/60" onClick={close} />
      <div role="dialog" aria-modal="true" className="mk-dialog relative z-10 w-full max-w-lg space-y-5 rounded-2xl border p-6">
        <div><h3 className="text-base font-bold">{mode === 'delete' ? 'Excluir importação?' : 'Detalhes da importação'}</h3>
          <p className="mt-1 text-xs text-[var(--mk-text-secondary)]">{mode === 'delete' ? selected.status === 'EXPIRED' ? 'Esta importação expirou e não foi confirmada. A exclusão removerá apenas o registro, o preview e os dados temporários.' : 'Esta ação apaga somente o histórico e dependências da importação. Lojas, indústrias, promotores, visitas e a operação vinculada serão mantidos.' : 'Resumo registrado no processamento do arquivo.'}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <Info label="Arquivo" value={selected.nomeArquivo} /><Info label="Data de envio" value={formatDatePtBr(selected.createdAt, true)} />
          <Info label="Operação vinculada" value={selected.operationName ?? 'Sem vínculo'} /><Info label="Status" value={selected.status} />
          <Info label="Quantidade de linhas" value={String(selected.totalRows)} /><Info label="Quantidade de visitas" value={String(selected.visits)} />
          <Info label="Layout detectado" value={selected.layout} /><Info label="Usuário" value={selected.userName} />
        </dl>
        {mode === 'delete' && <label className="block space-y-2 text-xs font-medium">Digite <strong>EXCLUIR</strong> para confirmar
          <input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-10 w-full rounded-xl border px-3" />
        </label>}
        <div className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-bg-secondary)] p-3 text-xs text-[var(--mk-text-secondary)]">
          Desfazer dados não está disponível: os registros desta importação não possuem rastreabilidade exclusiva.
        </div>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={close} disabled={loading}>Fechar</Button>
          {mode === 'delete' && <Button variant="destructive" loading={loading} disabled={confirmation !== 'EXCLUIR'} onClick={remove}>Excluir registro</Button>}
        </div>
      </div>
    </div>}
  </>;
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-3 py-3 first:pl-5 last:pr-5">{children}</th>; }
function Td({ children, strong = false, title }: { children: React.ReactNode; strong?: boolean; title?: string }) { return <td title={title} className={`truncate px-3 py-3.5 first:pl-5 ${strong ? 'font-bold text-[var(--mk-text)]' : ''}`}>{children}</td>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl border border-[var(--mk-border)] p-3"><dt className="text-[var(--mk-text-subtle)]">{label}</dt><dd className="mt-1 truncate font-semibold" title={value}>{value || '—'}</dd></div>; }

export default ImportsTable;
