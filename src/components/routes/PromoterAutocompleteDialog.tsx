'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { promoterInitials } from './routes-workspace-model';

type Item = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  status: string;
  operationId: string | null;
  weekVisitCount: number;
  alreadyInWeek: boolean;
};

export function PromoterAutocompleteDialog({
  operationId,
  weekStart,
  supervisors,
  onClose,
  onAddWithoutVisits,
  onCreateFirstVisit,
  onCopyRosterFromPreviousWeek,
  onCreate,
}: {
  operationId?: string;
  weekStart: string;
  supervisors: Array<{ id: string; name: string }>;
  onClose: () => void;
  onAddWithoutVisits: (item: Item) => Promise<void>;
  onCreateFirstVisit: (item: Item) => Promise<void>;
  onCopyRosterFromPreviousWeek: (item: Item) => Promise<void>;
  onCreate: (data: FormData) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<Item | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) return;
    const searchString = query.trim();
    if (searchString.length === 1) {
      setItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ q: searchString, weekStart: weekStart.slice(0, 10) });
        if (operationId) params.set('operationId', operationId);
        const response = await fetch(`/api/promotores/search?${params}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Não foi possível consultar os promotores.');
        setItems(body.items);
        setActiveIndex(0);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível consultar os promotores. Tente novamente.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, searchString.length === 0 ? 0 : 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [creating, operationId, query, weekStart]);

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') return onClose();
    if (!items.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => (index + 1) % items.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index - 1 + items.length) % items.length); }
    if (event.key === 'Enter') { event.preventDefault(); setSelected(items[activeIndex]); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(event) => event.key === 'Escape' && onClose()}>
    <button aria-label="Fechar modal" className="fixed inset-0 bg-[#1e1f22]/70" onClick={onClose} />
    <div role="dialog" aria-modal="true" aria-labelledby="promoter-dialog-title" className="mk-dialog relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-5">
      <header className="flex items-start justify-between gap-3"><div><h3 id="promoter-dialog-title" className="font-bold">Adicionar promotor ao roteiro</h3><p className="text-xs text-[var(--mk-text-subtle)]">{operationId ? 'Promotores vinculados ou disponíveis para a operação selecionada.' : 'Promotores ativos disponíveis.'}</p></div><button aria-label="Fechar" onClick={onClose}><X className="h-4 w-4" /></button></header>
      <div className="mt-4 flex gap-2"><Button size="sm" variant={!creating ? 'default' : 'outline'} onClick={() => setCreating(false)}>Selecionar existente</Button><Button size="sm" variant={creating ? 'default' : 'outline'} onClick={() => setCreating(true)}>Cadastrar novo</Button></div>
      {!creating ? <div className="mt-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mk-text-subtle)]" /><input ref={inputRef} role="combobox" aria-expanded="true" aria-controls="promoter-results" aria-activedescendant={items[activeIndex] ? `promoter-${items[activeIndex].id}` : undefined} autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSelected(null); }} onKeyDown={keyDown} placeholder="Nome, telefone, e-mail, cidade ou UF" className="h-10 w-full rounded-xl border pl-9 pr-24 text-xs" />{query && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[var(--mk-primary)]" onClick={() => { setQuery(''); setSelected(null); inputRef.current?.focus(); }}>Limpar busca</button>}</div>
        <div id="promoter-results" role="listbox" className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-[var(--mk-border)] bg-[var(--mk-card)]">
          {loading && <p className="flex items-center gap-2 p-4 text-xs text-[var(--mk-text-subtle)]"><Loader2 className="h-4 w-4 animate-spin" />Carregando promotores...</p>}
          {!loading && error && <p role="alert" className="p-4 text-xs text-[var(--mk-danger)]">{error} Tente novamente.</p>}
          {!loading && !error && !items.length && <p className="p-4 text-xs text-[var(--mk-text-subtle)]">Nenhum promotor encontrado{query.trim() ? ` para “${query.trim()}”` : ''}.</p>}
          {!loading && !error && items.map((item, index) => <button id={`promoter-${item.id}`} role="option" aria-selected={selected?.id === item.id} key={item.id} onMouseEnter={() => setActiveIndex(index)} onClick={() => setSelected(item)} className={`flex w-full items-center gap-3 border-b border-[var(--mk-border)] p-3 text-left last:border-0 ${activeIndex === index || selected?.id === item.id ? 'bg-[var(--mk-hover)]' : ''}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--mk-bg-secondary)] text-[10px] font-bold">{promoterInitials(item.name)}</span>
            <span className="min-w-0 flex-1"><b className="block truncate text-xs">{item.name}</b><small className="block truncate text-[var(--mk-text-subtle)]">{item.city || 'Cidade não informada'}/{item.state || 'UF'}{item.phone ? ` · ${item.phone}` : ''}</small><small className="block text-[var(--mk-text-subtle)]">{item.weekVisitCount ? `Já possui ${item.weekVisitCount} visita(s) nesta semana` : 'Sem visitas nesta semana'}</small></span>
            <span className={`mk-status ${item.alreadyInWeek ? 'mk-status-warning' : 'mk-status-success'}`}>{item.alreadyInWeek ? 'Já adicionado' : item.status}</span>
          </button>)}
        </div>
        {selected && (
          <section className="mt-3 rounded-xl border border-[var(--mk-border)] bg-[var(--mk-bg-secondary)] p-3">
            <p className="flex items-center gap-2 text-xs font-bold">
              <Check className="h-4 w-4 text-[var(--mk-success)]" />
              {selected.name}
            </p>
            {selected.alreadyInWeek ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-[var(--mk-text-subtle)]">Este promotor já está no roteiro desta semana.</p>
                <Button size="sm" onClick={() => { onClose(); onCreateFirstVisit(selected); }}>Abrir card existente</Button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void onAddWithoutVisits(selected)}>Adicionar sem visitas</Button>
                <Button size="sm" onClick={() => void onCreateFirstVisit(selected)}>Adicionar e criar primeira visita</Button>
                <Button size="sm" variant="outline" onClick={() => void onCopyRosterFromPreviousWeek(selected)}>Copiar roteiro da semana anterior</Button>
              </div>
            )}
          </section>
        )}
      </div> : <form action={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Nome"><input required name="name" /></Field><Field label="Telefone"><input name="phone" /></Field><Field label="Email"><input type="email" name="email" /></Field><Field label="Cidade"><input name="city" /></Field><Field label="UF"><input name="state" maxLength={2} /></Field><Field label="Supervisor"><select required name="supervisorId"><option value="">Selecione</option>{supervisors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><div className="flex justify-end sm:col-span-2"><Button type="submit">Cadastrar e vincular</Button></div></form>}
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-xs font-semibold">{label}<span className="block [&_input]:h-10 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:px-3 [&_select]:h-10 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:px-3">{children}</span></label>;
}
