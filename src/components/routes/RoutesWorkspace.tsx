'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Copy, Edit3, GripVertical, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type Visit = {
  id: string; operationId: string; operation: string; promoterId: string; promoter: string; storeId: string; store: string;
  industryId: string; industry: string; scheduledDate: string; status: 'PLANEJADA' | 'REALIZADA' | 'CANCELADA';
  routeOrder: number | null; weeklyFrequency: number; plannedTime: string | null; estimatedDurationMinutes: number | null; notes: string | null;
};
type Day = { value: number; label: string; visits: Visit[] };
type Options = {
  promoters: Array<{ id: string; name: string; operationId: string | null }>;
  operations: Array<{ id: string; name: string; status: string; startsAt: Date | string; endsAt: Date | string }>;
  industries: Array<{ id: string; name: string }>;
  stores: Array<{ id: string; name: string; chain: string | null; city: string | null; state: string | null; address: string | null }>;
};
type DraftGroup = {
  key: string; ids: string[]; operationId: string; promoterId: string; storeId: string; industryIds: string[];
  scheduledDate: string; routeOrder: number; weeklyFrequency: number; plannedTime: string; estimatedDurationMinutes: number | null;
  notes: string; status: Visit['status']; conflictJustification: string;
};

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function dateKey(value: string) { return value.slice(0, 10); }
function groupKey(item: Pick<DraftGroup, 'operationId' | 'promoterId' | 'storeId' | 'scheduledDate'>) { return `${item.operationId}:${item.promoterId}:${item.storeId}:${dateKey(item.scheduledDate)}`; }

function initialGroups(days: Day[]): DraftGroup[] {
  const visits = days.flatMap((day) => day.visits);
  return [...visits.reduce((map, visit, index) => {
    const key = `${visit.operationId}:${visit.promoterId}:${visit.storeId}:${dateKey(visit.scheduledDate)}`;
    const current = map.get(key) ?? {
      key, ids: [], operationId: visit.operationId, promoterId: visit.promoterId, storeId: visit.storeId, industryIds: [],
      scheduledDate: visit.scheduledDate, routeOrder: visit.routeOrder ?? index + 1, weeklyFrequency: visit.weeklyFrequency,
      plannedTime: visit.plannedTime ?? '', estimatedDurationMinutes: visit.estimatedDurationMinutes, notes: visit.notes ?? '',
      status: visit.status, conflictJustification: '',
    };
    current.ids.push(visit.id);
    if (!current.industryIds.includes(visit.industryId)) current.industryIds.push(visit.industryId);
    if (visit.status !== 'PLANEJADA') current.status = visit.status;
    map.set(key, current);
    return map;
  }, new Map<string, DraftGroup>()).values()].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.routeOrder - b.routeOrder);
}

export function RoutesWorkspace({ days, options: providedOptions, weekStart = new Date().toISOString(), weekEnd = new Date().toISOString() }: { days: Day[]; options?: Options; weekStart?: string; weekEnd?: string }) {
  const options = useMemo<Options>(() => providedOptions ?? {
    promoters: [...new Map(days.flatMap((day) => day.visits).map((visit) => [visit.promoterId, { id: visit.promoterId, name: visit.promoter, operationId: visit.operationId }])).values()],
    operations: [...new Map(days.flatMap((day) => day.visits).map((visit) => [visit.operationId, { id: visit.operationId, name: visit.operation, status: 'OPEN', startsAt: weekStart, endsAt: weekEnd }])).values()],
    industries: [...new Map(days.flatMap((day) => day.visits).map((visit) => [visit.industryId, { id: visit.industryId, name: visit.industry }])).values()],
    stores: [...new Map(days.flatMap((day) => day.visits).map((visit) => [visit.storeId, { id: visit.storeId, name: visit.store, chain: null, city: null, state: null, address: null }])).values()],
  }, [providedOptions, days, weekStart, weekEnd]);
  const baseline = useMemo(() => initialGroups(days), [days]);
  const originalIds = useMemo(() => days.flatMap((day) => day.visits.map((visit) => visit.id)), [days]);
  const [draft, setDraft] = useState(baseline);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<DraftGroup | null>(null);
  const [storeQuery, setStoreQuery] = useState('');
  const [batchPromoter, setBatchPromoter] = useState('');
  const [batchIndustry, setBatchIndustry] = useState('');

  const visible = useMemo(() => draft.filter((item) => {
    const promoter = options.promoters.find((entry) => entry.id === item.promoterId)?.name ?? '';
    const store = options.stores.find((entry) => entry.id === item.storeId)?.name ?? '';
    const industries = item.industryIds.map((id) => options.industries.find((entry) => entry.id === id)?.name).join(' ');
    return `${promoter} ${store} ${industries}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'));
  }), [draft, options, query]);
  const promoters = useMemo(() => [...new Set(visible.map((item) => item.promoterId))].map((id) => ({ id, name: options.promoters.find((item) => item.id === id)?.name ?? 'Promotor', visits: visible.filter((item) => item.promoterId === id) })).sort((a, b) => a.name.localeCompare(b.name)), [visible, options.promoters]);
  const conflictKeys = useMemo(() => new Set(draft.filter((item, index) => draft.some((other, otherIndex) => index !== otherIndex && item.operationId === other.operationId && item.promoterId === other.promoterId && dateKey(item.scheduledDate) === dateKey(other.scheduledDate) && item.storeId !== other.storeId && item.industryIds.some((id) => other.industryIds.includes(id)))).map((item) => item.key)), [draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  function cancel() { setDraft(baseline); setSelected([]); setForm(null); setEditing(false); }
  function openAdd(promoterId?: string, day?: number) {
    const operation = options.operations.find((item) => !['ARCHIVED', 'FINISHED', 'CANCELLED'].includes(item.status));
    const promoter = options.promoters.find((item) => item.id === promoterId) ?? options.promoters[0];
    const date = new Date(weekStart); date.setUTCDate(date.getUTCDate() + Math.max(0, (day ?? 1) - 1));
    if (!operation || !promoter || !options.stores[0] || !options.industries[0]) return toast.error('Cadastre operação, promotor, loja e indústria antes de criar o roteiro.');
    const next: DraftGroup = {
      key: `new:${crypto.randomUUID()}`, ids: [], operationId: operation.id, promoterId: promoter.id, storeId: options.stores[0].id,
      industryIds: [options.industries[0].id], scheduledDate: date.toISOString(), routeOrder: draft.filter((item) => item.promoterId === promoter.id && dateKey(item.scheduledDate) === dateKey(date.toISOString())).length + 1,
      weeklyFrequency: 1, plannedTime: '', estimatedDurationMinutes: null, notes: '', status: 'PLANEJADA', conflictJustification: '',
    };
    setStoreQuery(''); setForm(next);
  }
  function saveForm() {
    if (!form || !form.industryIds.length) return;
    const next = { ...form, key: form.ids.length ? groupKey(form) : form.key.startsWith('new:') ? form.key : groupKey(form) };
    setDraft((current) => current.some((item) => item.key === form.key) ? current.map((item) => item.key === form.key ? next : item) : [...current, next]);
    setForm(null);
  }
  function removeGroup(item: DraftGroup) {
    if (item.status !== 'PLANEJADA') return toast.error('Visitas realizadas não podem ser excluídas. Use cancelamento ou desvinculação.');
    if (!confirm(`Excluir visita planejada?\n\nEsta ação remove apenas a visita planejada do roteiro. Visitas já realizadas e evidências não serão apagadas.`)) return;
    setDraft((current) => current.filter((entry) => entry.key !== item.key));
    setSelected((current) => current.filter((key) => key !== item.key));
  }
  function moveSelected(day: number) {
    const target = new Date(weekStart); target.setUTCDate(target.getUTCDate() + day - 1);
    setDraft((current) => current.map((item) => selected.includes(item.key) && item.status === 'PLANEJADA' ? { ...item, scheduledDate: target.toISOString() } : item));
  }
  function changeSelectedPromoter() {
    if (!batchPromoter) return;
    setDraft((current) => current.map((item) => selected.includes(item.key) && item.status === 'PLANEJADA' ? { ...item, promoterId: batchPromoter } : item));
  }
  function changeSelectedIndustry(mode: 'add' | 'remove') {
    if (!batchIndustry) return;
    setDraft((current) => current.map((item) => !selected.includes(item.key) ? item : {
      ...item,
      industryIds: mode === 'add'
        ? [...new Set([...item.industryIds, batchIndustry])]
        : item.industryIds.filter((id) => id !== batchIndustry),
    }).filter((item) => item.industryIds.length > 0));
  }
  function duplicateSelectedToPromoter() {
    if (!batchPromoter) return;
    const copies = draft.filter((item) => selected.includes(item.key) && item.status === 'PLANEJADA').map((item) => ({ ...item, key: `new:${crypto.randomUUID()}`, ids: [], promoterId: batchPromoter }));
    setDraft((current) => [...current, ...copies]);
  }
  function copyNextWeek() {
    const copies = draft.filter((item) => item.status === 'PLANEJADA').map((item) => ({ ...item, key: `new:${crypto.randomUUID()}`, ids: [], scheduledDate: new Date(new Date(item.scheduledDate).getTime() + 7 * 86_400_000).toISOString() }));
    setDraft((current) => [...current, ...copies]);
    toast.info(`${copies.length} visita(s) copiadas para a próxima semana no rascunho.`);
  }
  async function persist() {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      const retainedIds = new Set(draft.flatMap((item) => item.ids.slice(0, 1)));
      const deleteIds = originalIds.filter((id) => !retainedIds.has(id));
      const upserts = draft.map((item) => ({
        id: item.ids[0], operationId: item.operationId, promoterId: item.promoterId, storeId: item.storeId,
        industryIds: item.industryIds, scheduledDate: item.scheduledDate, routeOrder: item.routeOrder,
        weeklyFrequency: item.weeklyFrequency, plannedTime: item.plannedTime || null,
        estimatedDurationMinutes: item.estimatedDurationMinutes, notes: item.notes || null, status: item.status,
        conflictJustification: item.conflictJustification || undefined,
      }));
      const scopeOperationIds = [...new Set([...draft.map((item) => item.operationId), ...baseline.map((item) => item.operationId)])];
      const response = await fetch('/api/routes/week', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ upserts, deleteIds, scopeOperationIds }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível salvar o roteiro.');
      toast.success('Roteiro semanal salvo.');
      window.location.reload();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o roteiro.'); }
    finally { setBusy(false); }
  }

  return <section className={`space-y-3 ${editing ? 'rounded-2xl ring-2 ring-[var(--mk-primary)] ring-offset-4 ring-offset-[var(--mk-bg)]' : ''}`}>
    <div className="mk-panel flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between">
      <div><p className="text-sm font-bold">Semana de {new Date(weekStart).toLocaleDateString('pt-BR')} a {new Date(weekEnd).toLocaleDateString('pt-BR')}</p><p className="text-[10px] text-[var(--mk-text-subtle)]">{editing ? 'Modo de edição — alterações ainda não salvas' : `${draft.length} visita(s) agrupada(s) por loja`}</p></div>
      <div className="relative min-w-0 flex-1 xl:max-w-sm"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--mk-text-subtle)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar promotor, loja ou indústria" className="h-9 w-full rounded-lg pl-9 pr-3 text-xs" /></div>
      <div className="flex flex-wrap gap-2">{!editing ? <Button onClick={() => setEditing(true)}><Edit3 />Editar roteiro</Button> : <><Button variant="outline" onClick={copyNextWeek}><Copy />Copiar semana</Button><Button variant="outline" onClick={cancel}><X />Cancelar</Button><Button loading={busy} disabled={!dirty} onClick={() => void persist()}><Save />Salvar alterações</Button></>}</div>
    </div>
    {editing && selected.length > 0 && <div className="mk-panel space-y-2 p-3 text-xs"><div className="flex flex-wrap items-center gap-2"><strong>{selected.length} selecionada(s)</strong><span>Mover para:</span>{[1, 2, 3, 4, 5, 6].map((day) => <Button key={day} size="sm" variant="outline" onClick={() => moveSelected(day)}>{dayLabels[day]}</Button>)}<Button size="sm" variant="destructive" onClick={() => setDraft((current) => current.filter((item) => !selected.includes(item.key) || item.status !== 'PLANEJADA'))}><Trash2 />Excluir planejadas</Button></div><div className="flex flex-wrap items-center gap-2"><select className="h-8 rounded-lg border px-2" value={batchPromoter} onChange={(event) => setBatchPromoter(event.target.value)}><option value="">Escolher promotor</option>{options.promoters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Button size="sm" variant="outline" onClick={changeSelectedPromoter}>Trocar promotor</Button><Button size="sm" variant="outline" onClick={duplicateSelectedToPromoter}>Duplicar para promotor</Button><select className="h-8 rounded-lg border px-2" value={batchIndustry} onChange={(event) => setBatchIndustry(event.target.value)}><option value="">Escolher indústria</option>{options.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Button size="sm" variant="outline" onClick={() => changeSelectedIndustry('add')}>Adicionar indústria</Button><Button size="sm" variant="outline" onClick={() => changeSelectedIndustry('remove')}>Remover indústria</Button></div></div>}
    <div className="space-y-2">{promoters.map((promoter, promoterIndex) => <details key={promoter.id} className="mk-panel group" open={promoterIndex === 0}><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--mk-bg-secondary)] text-[10px] font-bold text-[var(--mk-primary)]">{promoter.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{promoter.name}</p><p className="text-[10px] text-[var(--mk-text-subtle)]">{new Set(promoter.visits.map((item) => item.storeId)).size} lojas · {new Set(promoter.visits.flatMap((item) => item.industryIds)).size} indústrias · {conflictKeys.size} conflito(s)</p></div><div className="hidden gap-1 sm:flex">{[1, 2, 3, 4, 5, 6].map((day) => <span key={day} className="rounded-md bg-[var(--mk-bg-secondary)] px-2 py-1 text-[9px]">{dayLabels[day]} <b>{promoter.visits.filter((item) => new Date(item.scheduledDate).getUTCDay() === day).length}</b></span>)}</div><ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
      <div className="border-t border-[var(--mk-border)] p-3"><div className="grid gap-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((day) => { const items = promoter.visits.filter((item) => new Date(item.scheduledDate).getUTCDay() === day).sort((a, b) => a.routeOrder - b.routeOrder); return <div key={day} className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-bg-secondary)]"><div className="flex items-center justify-between border-b px-3 py-2"><b className="text-[10px]">{dayLabels[day]}</b>{editing && <button className="text-[10px] font-bold text-[var(--mk-primary)]" onClick={() => openAdd(promoter.id, day)}><Plus className="inline h-3 w-3" />Adicionar visita</button>}</div><div className="divide-y">{items.map((item, index) => <RouteRow key={item.key} item={item} index={index} editing={editing} selected={selected.includes(item.key)} conflict={conflictKeys.has(item.key)} options={options} onSelect={(checked) => setSelected((current) => checked ? [...current, item.key] : current.filter((key) => key !== item.key))} onEdit={() => { setStoreQuery(''); setForm({ ...item }); }} onDelete={() => removeGroup(item)} />)}{!items.length && <p className="p-4 text-center text-[10px] text-[var(--mk-text-subtle)]">Sem visitas</p>}</div></div>; })}</div></div>
    </details>)}</div>
    {!promoters.length && <div className="mk-panel py-12 text-center text-xs text-[var(--mk-text-subtle)]">Nenhum roteiro nesta semana. Ative o modo de edição e adicione uma visita.</div>}
    {form && <RouteForm form={form} setForm={setForm} storeQuery={storeQuery} setStoreQuery={setStoreQuery} options={options} draft={draft} onCancel={() => setForm(null)} onSave={saveForm} />}
  </section>;
}

function RouteRow({ item, index, editing, selected, conflict, options, onSelect, onEdit, onDelete }: { item: DraftGroup; index: number; editing: boolean; selected: boolean; conflict: boolean; options: Options; onSelect: (value: boolean) => void; onEdit: () => void; onDelete: () => void }) {
  const store = options.stores.find((entry) => entry.id === item.storeId);
  const industries = item.industryIds.map((id) => options.industries.find((entry) => entry.id === id)?.name).filter(Boolean).join(', ');
  return <div className={`grid grid-cols-[auto_24px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-[10px] ${conflict ? 'bg-amber-50' : ''}`}>{editing ? <input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} /> : <GripVertical className="h-3 w-3 text-[var(--mk-text-subtle)]" />}<span className="font-mono text-[var(--mk-text-subtle)]">{String(item.routeOrder || index + 1).padStart(2, '0')}</span><button className="min-w-0 text-left" onClick={editing ? onEdit : undefined}><p className="truncate font-semibold">{store?.name || 'Loja'}</p><p className="truncate text-[var(--mk-text-subtle)]">{industries} {item.plannedTime && `· ${item.plannedTime}`}</p>{conflict && <p className="text-amber-700">Conflito operacional</p>}</button>{editing && <div className="flex gap-1"><button title="Editar" onClick={onEdit}><Edit3 className="h-3.5 w-3.5" /></button><button title="Excluir" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-[var(--mk-danger)]" /></button></div>}</div>;
}

function RouteForm({ form, setForm, storeQuery, setStoreQuery, options, draft, onCancel, onSave }: { form: DraftGroup; setForm: (value: DraftGroup) => void; storeQuery: string; setStoreQuery: (value: string) => void; options: Options; draft: DraftGroup[]; onCancel: () => void; onSave: () => void }) {
  const stores = options.stores.filter((item) => `${item.name} ${item.chain || ''} ${item.city || ''} ${item.state || ''} ${item.address || ''}`.toLocaleLowerCase('pt-BR').includes(storeQuery.toLocaleLowerCase('pt-BR'))).slice(0, 20);
  const sameDay = draft.filter((item) => item.promoterId === form.promoterId && dateKey(item.scheduledDate) === dateKey(form.scheduledDate) && item.key !== form.key);
  const conflict = sameDay.some((item) => item.storeId !== form.storeId && item.industryIds.some((id) => form.industryIds.includes(id)));
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button className="fixed inset-0 bg-black/60" onClick={onCancel} /><div role="dialog" aria-modal="true" className="mk-dialog relative z-10 max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border p-6"><div><h3 className="font-bold">{form.ids.length ? 'Editar visita do roteiro' : 'Adicionar visita'}</h3><p className="text-xs text-[var(--mk-text-subtle)]">As alterações permanecerão no rascunho até salvar a semana.</p></div>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Operação"><select value={form.operationId} onChange={(event) => setForm({ ...form, operationId: event.target.value })}>{options.operations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Promotor"><select value={form.promoterId} onChange={(event) => setForm({ ...form, promoterId: event.target.value })}>{options.promoters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Dia"><input type="date" value={dateKey(form.scheduledDate)} onChange={(event) => setForm({ ...form, scheduledDate: `${event.target.value}T12:00:00.000Z` })} /></Field><Field label="Ordem"><input type="number" min={1} value={form.routeOrder} onChange={(event) => setForm({ ...form, routeOrder: Number(event.target.value) })} /></Field><Field label="Frequência semanal"><input type="number" min={1} value={form.weeklyFrequency} onChange={(event) => setForm({ ...form, weeklyFrequency: Number(event.target.value) })} /></Field><Field label="Horário previsto"><input type="time" value={form.plannedTime} onChange={(event) => setForm({ ...form, plannedTime: event.target.value })} /></Field><Field label="Duração estimada (min)"><input type="number" min={1} value={form.estimatedDurationMinutes ?? ''} onChange={(event) => setForm({ ...form, estimatedDurationMinutes: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="Status"><select value={form.status} disabled={form.status !== 'PLANEJADA'} onChange={(event) => setForm({ ...form, status: event.target.value as Visit['status'] })}><option value="PLANEJADA">Planejada</option><option value="CANCELADA">Cancelada</option></select></Field></div>
    <div><label className="text-xs font-semibold">Indústrias</label><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{options.industries.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-lg border p-2 text-xs"><input type="checkbox" checked={form.industryIds.includes(item.id)} onChange={(event) => setForm({ ...form, industryIds: event.target.checked ? [...form.industryIds, item.id] : form.industryIds.filter((id) => id !== item.id) })} />{item.name}</label>)}</div></div>
    <div><label className="text-xs font-semibold">Buscar loja</label><input value={storeQuery} onChange={(event) => setStoreQuery(event.target.value)} placeholder="Nome, rede, cidade, endereço ou UF" className="mt-2 h-10 w-full rounded-xl border px-3 text-xs" /><div className="mt-2 max-h-40 overflow-y-auto rounded-xl border">{stores.map((item) => { const existing = sameDay.find((entry) => entry.storeId === item.id); return <button key={item.id} onClick={() => setForm({ ...form, storeId: item.id })} className={`block w-full border-b p-2 text-left text-xs ${form.storeId === item.id ? 'bg-[var(--mk-hover)]' : ''}`}><strong>{item.name}</strong><span className="block text-[10px] text-[var(--mk-text-subtle)]">{item.city || 'Cidade não informada'} - {item.state || 'UF'} · {existing ? 'Já atendida neste dia' : 'Sem visita neste dia'}</span></button>; })}</div></div>
    <Field label="Observação"><textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
    {conflict && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"><strong>Este promotor já atende outra indústria em outra loja neste dia.</strong><Field label="Justificativa administrativa"><textarea rows={2} value={form.conflictJustification} onChange={(event) => setForm({ ...form, conflictJustification: event.target.value })} /></Field></div>}
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button disabled={!form.industryIds.length || (conflict && !form.conflictJustification.trim())} onClick={onSave}><Check />Adicionar ao rascunho</Button></div>
  </div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1 text-xs font-semibold">{label}<span className="block [&_input]:h-10 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:px-3 [&_select]:h-10 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:px-3 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:p-3">{children}</span></label>; }
