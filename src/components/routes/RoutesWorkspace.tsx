'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, Edit3, ExternalLink, Eye, EyeOff, GripVertical, MoreHorizontal, Plus, Save, Search, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { groupPromotersById, promoterInitials, removePromoterPlanning } from './routes-workspace-model';
import { PromoterAutocompleteDialog } from './PromoterAutocompleteDialog';

type Visit = { id: string; operationId: string; operation: string; promoterId: string; promoter: string; storeId: string; store: string; industryId: string; industry: string; scheduledDate: string; status: 'PLANEJADA' | 'REALIZADA' | 'CANCELADA'; routeOrder: number | null; weeklyFrequency: number; plannedTime: string | null; estimatedDurationMinutes: number | null; notes: string | null };
type Day = { value: number; label: string; visits: Visit[] };
type PromoterOption = { id: string; name: string; phone?: string | null; city?: string | null; state?: string | null; operationId: string | null; _count?: { visits: number } };
type Options = { promoters: PromoterOption[]; operations: Array<{ id: string; name: string; status: string; startsAt: Date | string; endsAt: Date | string }>; industries: Array<{ id: string; name: string }>; stores: Array<{ id: string; name: string; chain: string | null; city: string | null; state: string | null; address: string | null }>; supervisors?: Array<{ id: string; name: string }> };
type DraftGroup = { key: string; ids: string[]; operationId: string; promoterId: string; storeId: string; industryIds: string[]; scheduledDate: string; routeOrder: number; weeklyFrequency: number; plannedTime: string; estimatedDurationMinutes: number | null; notes: string; status: Visit['status']; conflictJustification: string };
const daysOfWeek = [{ value: 1, short: 'Seg', label: 'Segunda' }, { value: 2, short: 'Ter', label: 'Terça' }, { value: 3, short: 'Qua', label: 'Quarta' }, { value: 4, short: 'Qui', label: 'Quinta' }, { value: 5, short: 'Sex', label: 'Sexta' }, { value: 6, short: 'Sáb', label: 'Sábado' }];
function dateKey(value: string) { return value.slice(0, 10); }
function groupKey(item: Pick<DraftGroup, 'operationId' | 'promoterId' | 'storeId' | 'scheduledDate'>) { return `${item.operationId}:${item.promoterId}:${item.storeId}:${dateKey(item.scheduledDate)}`; }
function initialGroups(days: Day[]): DraftGroup[] { const visits = days.flatMap((day) => day.visits); return [...visits.reduce((map, visit, index) => { const key = `${visit.operationId}:${visit.promoterId}:${visit.storeId}:${dateKey(visit.scheduledDate)}`; const current = map.get(key) ?? { key, ids: [], operationId: visit.operationId, promoterId: visit.promoterId, storeId: visit.storeId, industryIds: [], scheduledDate: visit.scheduledDate, routeOrder: visit.routeOrder ?? index + 1, weeklyFrequency: visit.weeklyFrequency, plannedTime: visit.plannedTime ?? '', estimatedDurationMinutes: visit.estimatedDurationMinutes, notes: visit.notes ?? '', status: visit.status, conflictJustification: '' }; current.ids.push(visit.id); if (!current.industryIds.includes(visit.industryId)) current.industryIds.push(visit.industryId); if (visit.status !== 'PLANEJADA') current.status = visit.status; map.set(key, current); return map; }, new Map<string, DraftGroup>()).values()].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.routeOrder - b.routeOrder); }
export function RoutesWorkspace({ days, options: providedOptions, weekStart = new Date().toISOString(), weekEnd = new Date().toISOString(), defaultOperationId }: { days: Day[]; options?: Options; weekStart?: string; weekEnd?: string; defaultOperationId: string }) {
  const options = useMemo<Options>(() => providedOptions ?? { promoters: [...new Map(days.flatMap(d => d.visits).map(v => [v.promoterId, { id: v.promoterId, name: v.promoter, operationId: v.operationId }])).values()], operations: [...new Map(days.flatMap(d => d.visits).map(v => [v.operationId, { id: v.operationId, name: v.operation, status: 'OPEN', startsAt: weekStart, endsAt: weekEnd }])).values()], industries: [...new Map(days.flatMap(d => d.visits).map(v => [v.industryId, { id: v.industryId, name: v.industry }])).values()], stores: [...new Map(days.flatMap(d => d.visits).map(v => [v.storeId, { id: v.storeId, name: v.store, chain: null, city: null, state: null, address: null }])).values()], supervisors: [] }, [providedOptions, days, weekStart, weekEnd]);
  const visitPromoters = useMemo(() => [...new Map(days.flatMap(day => day.visits).map(visit => [visit.promoterId, { id: visit.promoterId, name: visit.promoter, operationId: visit.operationId }])).values()], [days]);
  const [addedPromoters, setAddedPromoters] = useState<RosterPromoter[]>([]);
  const allPromoters = useMemo(() => {
    const list = [...options.promoters, ...addedPromoters];
    return [...new Map(list.map(x => [x.id, x])).values()];
  }, [options.promoters, addedPromoters]);
  const rosterPromoters = useMemo(() => [...new Map([...allPromoters, ...visitPromoters].map(promoter => [promoter.id, promoter])).values()], [allPromoters, visitPromoters]);
  const baseline = useMemo(() => initialGroups(days), [days]); const originalIds = useMemo(() => days.flatMap(d => d.visits.map(v => v.id)), [days]);
  const [draft, setDraft] = useState(baseline); const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false); const [query, setQuery] = useState(''); const [selected, setSelected] = useState<string[]>([]); const [form, setForm] = useState<DraftGroup | null>(null); const [storeQuery, setStoreQuery] = useState(''); const [batchPromoter, setBatchPromoter] = useState(''); const [batchIndustry, setBatchIndustry] = useState(''); const [showEmptyDays, setShowEmptyDays] = useState(false); const [rosterFilter, setRosterFilter] = useState<'with' | 'without' | 'all'>('with'); const [addPromoterOpen, setAddPromoterOpen] = useState(false); const [createPromoter, setCreatePromoter] = useState(false); const [promoterQuery, setPromoterQuery] = useState('');
  const activeOperationId = defaultOperationId || (new Set(draft.map(item => item.operationId)).size === 1 ? draft[0]?.operationId : undefined);
  const visible = useMemo(() => draft.filter(item => { const p = rosterPromoters.find(x => x.id === item.promoterId)?.name ?? ''; const s = options.stores.find(x => x.id === item.storeId)?.name ?? ''; const i = item.industryIds.map(id => options.industries.find(x => x.id === id)?.name).join(' '); return `${p} ${s} ${i}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')); }), [draft, options, rosterPromoters, query]);
  const routePromoters = useMemo(() => groupPromotersById(rosterPromoters, visible, activeOperationId).filter(p => p.visits.length > 0), [rosterPromoters, visible, activeOperationId]);
  const withoutRoute = useMemo(() => activeOperationId ? groupPromotersById(rosterPromoters, draft, activeOperationId).filter(p => p.visits.length === 0) : [], [rosterPromoters, draft, activeOperationId]);
  const shownPromoters = rosterFilter === 'without' ? [] : routePromoters; const conflictKeys = useMemo(() => new Set(draft.filter((item, index) => draft.some((other, otherIndex) => index !== otherIndex && item.operationId === other.operationId && item.promoterId === other.promoterId && dateKey(item.scheduledDate) === dateKey(other.scheduledDate) && item.storeId !== other.storeId && item.industryIds.some(id => other.industryIds.includes(id)))).map(item => item.key)), [draft]); const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  async function addPromoterWithoutVisits(item: any) {
    if (item.operationId !== activeOperationId) {
      await fetch(`/api/promotores/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationId: activeOperationId }),
      });
    }
    setAddedPromoters(current => [
      ...current,
      { id: item.id, name: item.name, operationId: activeOperationId }
    ]);
    toast.success(`Promotor ${item.name} adicionado ao roteiro da semana.`);
    setAddPromoterOpen(false);
  }

  async function createFirstVisit(item: any) {
    if (item.operationId !== activeOperationId) {
      await fetch(`/api/promotores/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationId: activeOperationId }),
      });
    }
    setAddedPromoters(current => [
      ...current,
      { id: item.id, name: item.name, operationId: activeOperationId }
    ]);
    setAddPromoterOpen(false);
    setEditing(true);
    openAdd(item.id);
  }

  async function copyRosterFromPreviousWeek(item: any) {
    try {
      const response = await fetch(`/api/promotores/${item.id}`);
      if (!response.ok) throw new Error('Não foi possível obter os dados do promotor.');
      const promoterData = await response.json();
      
      const prevWeekStart = new Date(new Date(weekStart).getTime() - 7 * 86_400_000);
      const prevWeekEnd = new Date(prevWeekStart.getTime() + 7 * 86_400_000 - 1);
      
      const prevVisits = (promoterData.visits || []).filter((v: any) => {
        const d = new Date(v.scheduledDate);
        return d >= prevWeekStart && d <= prevWeekEnd;
      });
      
      if (!prevVisits.length) {
        toast.error('Este promotor não possui visitas na semana anterior para copiar.');
        return;
      }
      
      if (item.operationId !== activeOperationId) {
        await fetch(`/api/promotores/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationId: activeOperationId }),
        });
      }
      
      const newVisits = prevVisits.map((v: any) => {
        const scheduledDate = new Date(v.scheduledDate);
        scheduledDate.setDate(scheduledDate.getDate() + 7);
        
        return {
          key: `new:${crypto.randomUUID()}`,
          ids: [],
          operationId: activeOperationId,
          promoterId: item.id,
          storeId: v.storeId,
          industryIds: [v.industryId],
          scheduledDate: scheduledDate.toISOString(),
          routeOrder: v.routeOrder || 1,
          weeklyFrequency: v.weeklyFrequency || 1,
          plannedTime: v.plannedTime || '',
          estimatedDurationMinutes: v.estimatedDurationMinutes || null,
          notes: v.notes || '',
          status: 'PLANEJADA' as const,
          conflictJustification: ''
        };
      });
      
      setDraft(current => [...current, ...newVisits]);
      setAddedPromoters(current => [
        ...current,
        { id: item.id, name: item.name, operationId: activeOperationId }
      ]);
      
      toast.success(`${newVisits.length} visita(s) copiadas da semana anterior.`);
      setAddPromoterOpen(false);
    } catch (e) {
      toast.error('Erro ao copiar roteiro da semana anterior.');
    }
  }

  function cancel() { setDraft(baseline); setSelected([]); setForm(null); setEditing(false); }
  function openAdd(promoterId?: string, day = 1) { const promoter = allPromoters.find(x => x.id === promoterId) ?? allPromoters[0]; const targetOperationId = activeOperationId || defaultOperationId; const date = new Date(weekStart); date.setUTCDate(date.getUTCDate() + day - 1); if (!promoter || !options.stores[0] || !options.industries[0]) return toast.error('Cadastre promotor, loja e indústria antes de criar o roteiro.'); setStoreQuery(''); setForm({ key: `new:${crypto.randomUUID()}`, ids: [], operationId: targetOperationId, promoterId: promoter.id, storeId: options.stores[0].id, industryIds: [options.industries[0].id], scheduledDate: date.toISOString(), routeOrder: draft.filter(x => x.promoterId === promoter.id && dateKey(x.scheduledDate) === dateKey(date.toISOString())).length + 1, weeklyFrequency: 1, plannedTime: '', estimatedDurationMinutes: null, notes: '', status: 'PLANEJADA', conflictJustification: '' }); }
  function saveForm() { if (!form || !form.industryIds.length) return; const next = { ...form, key: form.ids.length ? groupKey(form) : form.key }; setDraft(current => current.some(x => x.key === form.key) ? current.map(x => x.key === form.key ? next : x) : [...current, next]); setForm(null); }
  function removeGroup(item: DraftGroup) { if (item.status !== 'PLANEJADA') return toast.error('Visitas realizadas não podem ser excluídas.'); if (!confirm('Excluir esta visita planejada? Visitas realizadas e evidências serão preservadas.')) return; setDraft(current => current.filter(x => x.key !== item.key)); setSelected(current => current.filter(key => key !== item.key)); }
  function removePromoter(promoterId: string) { const planned = draft.filter(x => x.promoterId === promoterId && x.status === 'PLANEJADA').length; if (!planned || !confirm(`Remover ${planned} visita(s) planejada(s) deste promotor na semana? Visitas realizadas serão preservadas.`)) return; setDraft(current => removePromoterPlanning(current, promoterId) as DraftGroup[]); }
  function moveSelected(day: number) { const date = new Date(weekStart); date.setUTCDate(date.getUTCDate() + day - 1); setDraft(current => current.map(x => selected.includes(x.key) && x.status === 'PLANEJADA' ? { ...x, scheduledDate: date.toISOString() } : x)); }
  function changeSelectedPromoter() { if (batchPromoter) setDraft(current => current.map(x => selected.includes(x.key) && x.status === 'PLANEJADA' ? { ...x, promoterId: batchPromoter } : x)); }
  function changeSelectedIndustry(mode: 'add' | 'remove') { if (!batchIndustry) return; setDraft(current => current.map(x => !selected.includes(x.key) ? x : { ...x, industryIds: mode === 'add' ? [...new Set([...x.industryIds, batchIndustry])] : x.industryIds.filter(id => id !== batchIndustry) }).filter(x => x.industryIds.length)); }
  function duplicateSelectedToPromoter() { if (!batchPromoter) return; setDraft(current => [...current, ...draft.filter(x => selected.includes(x.key) && x.status === 'PLANEJADA').map(x => ({ ...x, key: `new:${crypto.randomUUID()}`, ids: [], promoterId: batchPromoter }))]); }
  function copyNextWeek() { const copies = draft.filter(x => x.status === 'PLANEJADA').map(x => ({ ...x, key: `new:${crypto.randomUUID()}`, ids: [], scheduledDate: new Date(new Date(x.scheduledDate).getTime() + 7 * 86400000).toISOString() })); setDraft(current => [...current, ...copies]); toast.info(`${copies.length} visita(s) copiadas para a próxima semana no rascunho.`); }
  async function persist() { if (!dirty || busy) return; setBusy(true); try { const retained = new Set(draft.flatMap(x => x.ids.slice(0, 1))); const upserts = draft.map(x => ({ id: x.ids[0], operationId: x.operationId, promoterId: x.promoterId, storeId: x.storeId, industryIds: x.industryIds, scheduledDate: x.scheduledDate, routeOrder: x.routeOrder, weeklyFrequency: x.weeklyFrequency, plannedTime: x.plannedTime || null, estimatedDurationMinutes: x.estimatedDurationMinutes, notes: x.notes || null, status: x.status, conflictJustification: x.conflictJustification || undefined })); const scopeOperationIds = [...new Set([...draft.map(x => x.operationId), ...baseline.map(x => x.operationId), ...(activeOperationId ? [activeOperationId] : [])])]; const response = await fetch('/api/routes/week', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ upserts, deleteIds: originalIds.filter(id => !retained.has(id)), scopeOperationIds }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Não foi possível salvar o roteiro.'); toast.success('Roteiro semanal salvo.'); window.location.reload(); } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o roteiro.'); } finally { setBusy(false); } }
  async function submitPromoter(data: FormData) {
    const payload = Object.fromEntries(['name','phone','email','city','state','supervisorId'].map(key => [key, data.get(key)]));
    Object.assign(payload, { operationId: activeOperationId || defaultOperationId || '', status: 'ACTIVE' });
    const response = await fetch('/api/promotores', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json();
    if (!response.ok) return toast.error(body.error || 'Não foi possível cadastrar o promotor.');
    
    toast.success('Promotor cadastrado e vinculado.');
    
    const newPromoter = {
      id: body.id,
      name: body.name,
      city: body.city || null,
      state: body.state || null,
      phone: body.phone || null,
      status: body.status,
      operationId: body.operationId,
      weekVisitCount: 0,
      alreadyInWeek: false
    };
    
    setAddedPromoters(current => [...current, newPromoter]);
    setAddPromoterOpen(false);
    setEditing(true);
    openAdd(body.id);
  }

  return <section className={`space-y-3 ${editing ? 'rounded-2xl ring-2 ring-[var(--mk-primary)] ring-offset-4 ring-offset-[var(--mk-bg)]' : ''}`}>
    <div className="mk-panel flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between"><div><p className="text-sm font-bold">Semana de {new Date(weekStart).toLocaleDateString('pt-BR')} a {new Date(weekEnd).toLocaleDateString('pt-BR')}</p><p className="text-[10px] text-[var(--mk-text-subtle)]">{editing ? 'Modo de edição — alterações ainda não salvas' : `${draft.length} rota(s) agrupada(s) por loja`}</p></div><div className="relative min-w-0 flex-1 xl:max-w-sm"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar promotor, loja ou indústria" className="h-9 w-full rounded-lg pl-9 pr-3 text-xs"/></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setAddPromoterOpen(true)}><UserPlus/>Adicionar promotor ao roteiro</Button>{!editing ? <Button onClick={() => setEditing(true)}><Edit3/>Editar roteiro</Button> : <><Button variant="outline" onClick={copyNextWeek}><Copy/>Copiar semana</Button><Button variant="outline" onClick={cancel}><X/>Cancelar</Button><Button loading={busy} disabled={!dirty} onClick={() => void persist()}><Save/>Salvar alterações</Button></>}</div></div>
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex rounded-lg border p-0.5">{(['with','without','all'] as const).map(value => <button key={value} onClick={() => setRosterFilter(value)} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold ${rosterFilter === value ? 'bg-[var(--mk-hover)]' : ''}`}>{value === 'with' ? 'Com roteiro' : value === 'without' ? 'Sem roteiro' : 'Todos'}</button>)}</div><button onClick={() => setShowEmptyDays(v => !v)} className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--mk-text-secondary)]">{showEmptyDays ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}{showEmptyDays ? 'Ocultar dias vazios' : 'Mostrar dias vazios'}</button></div>
    {editing && selected.length > 0 && <div className="mk-panel space-y-2 p-3 text-xs"><div className="flex flex-wrap items-center gap-2"><strong>{selected.length} selecionada(s)</strong>{daysOfWeek.map(day => <Button key={day.value} size="sm" variant="outline" onClick={() => moveSelected(day.value)}>{day.short}</Button>)}<Button size="sm" variant="destructive" onClick={() => setDraft(current => current.filter(x => !selected.includes(x.key) || x.status !== 'PLANEJADA'))}><Trash2/>Excluir planejadas</Button></div><div className="flex flex-wrap gap-2"><select value={batchPromoter} onChange={e => setBatchPromoter(e.target.value)}><option value="">Promotor</option>{allPromoters.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><Button size="sm" variant="outline" onClick={changeSelectedPromoter}>Trocar</Button><Button size="sm" variant="outline" onClick={duplicateSelectedToPromoter}>Duplicar</Button><select value={batchIndustry} onChange={e => setBatchIndustry(e.target.value)}><option value="">Indústria</option>{options.industries.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><Button size="sm" variant="outline" onClick={() => changeSelectedIndustry('add')}>Adicionar indústria</Button><Button size="sm" variant="outline" onClick={() => changeSelectedIndustry('remove')}>Remover indústria</Button></div></div>}
    <div className="space-y-2">{shownPromoters.map((promoter, index) => <details key={promoter.id} className="mk-panel group" open={index === 0}><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--mk-bg-secondary)] text-[10px] font-bold text-[var(--mk-primary)]">{promoterInitials(promoter.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{promoter.name}</p><p className="text-[10px] text-[var(--mk-text-subtle)]">{new Set(promoter.visits.map(x => x.storeId)).size} lojas · {new Set(promoter.visits.flatMap(x => x.industryIds)).size} indústrias · {promoter.visits.filter(x => conflictKeys.has(x.key)).length} conflitos</p></div><div className="hidden gap-1 overflow-x-auto sm:flex">{daysOfWeek.map(day => <span key={day.value} className="rounded-md bg-[var(--mk-bg-secondary)] px-2 py-1 text-[9px]">{day.short} <b>{promoter.visits.filter(x => new Date(x.scheduledDate).getUTCDay() === day.value).length}</b></span>)}</div><span className="mk-status mk-status-info">Total {promoter.visits.length}</span><ChevronDown className="h-4 w-4 transition group-open:rotate-180"/></summary><div className="border-t border-[var(--mk-border)] p-3"><div className="mb-2 flex justify-end"><PromoterMenu promoterId={promoter.id} editing={editing} onAdd={() => openAdd(promoter.id)} onRemove={() => removePromoter(promoter.id)}/></div><div className="grid gap-2 lg:grid-cols-3">{daysOfWeek.map(day => { const items = promoter.visits.filter(x => new Date(x.scheduledDate).getUTCDay() === day.value).sort((a,b) => a.routeOrder - b.routeOrder); if (!items.length && !editing && !showEmptyDays) return null; return <details key={day.value} className="rounded-lg border border-[var(--mk-border)] bg-[var(--mk-bg-secondary)]" open={items.length > 0}><summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[10px] font-bold">{day.label}<span className="text-[var(--mk-text-subtle)]">{items.length ? `${items.length} visita(s)` : 'Sem visitas'}</span></summary>{(items.length > 0 || editing) && <div className="divide-y divide-[var(--mk-border)] border-t border-[var(--mk-border)]">{items.map((item, row) => <RouteRow key={item.key} item={item} index={row} editing={editing} selected={selected.includes(item.key)} conflict={conflictKeys.has(item.key)} options={options} onSelect={checked => setSelected(current => checked ? [...current, item.key] : current.filter(key => key !== item.key))} onEdit={() => { setStoreQuery(''); setForm({...item}); }} onMove={() => { setSelected([item.key]); }} onDuplicate={() => setDraft(current => [...current, {...item, key:`new:${crypto.randomUUID()}`, ids:[]}])} onDelete={() => removeGroup(item)}/>) }{editing && <button className="w-full px-3 py-2 text-left text-[10px] font-bold text-[var(--mk-primary)]" onClick={() => openAdd(promoter.id, day.value)}><Plus className="mr-1 inline h-3 w-3"/>Adicionar visita</button>}</div>}</details>})}</div></div></details>)}</div>
    {(rosterFilter === 'without' || rosterFilter === 'all') && withoutRoute.length > 0 && <section className="mk-panel"><div className="border-b px-4 py-3"><h3 className="text-xs font-bold">Promotores sem roteiro nesta semana</h3></div><div className="divide-y">{withoutRoute.map(p => <div key={p.id} className="flex items-center gap-3 px-4 py-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--mk-bg-secondary)] text-[9px] font-bold">{promoterInitials(p.name)}</span><span className="min-w-0 flex-1 truncate text-xs font-semibold">{p.name}</span><Button size="sm" variant="outline" onClick={() => { setEditing(true); openAdd(p.id); }}><Plus/>Montar roteiro</Button></div>)}</div></section>}
    {!shownPromoters.length && rosterFilter === 'with' && <div className="mk-panel py-10 text-center text-xs text-[var(--mk-text-subtle)]">Nenhum roteiro nesta semana.</div>}
    {form && <RouteForm form={form} setForm={setForm} storeQuery={storeQuery} setStoreQuery={setStoreQuery} options={options} draft={draft} onCancel={() => setForm(null)} onSave={saveForm}/>} {addPromoterOpen && (
      <PromoterAutocompleteDialog
        operationId={activeOperationId}
        weekStart={weekStart}
        supervisors={options.supervisors || []}
        onClose={() => setAddPromoterOpen(false)}
        onAddWithoutVisits={addPromoterWithoutVisits}
        onCreateFirstVisit={createFirstVisit}
        onCopyRosterFromPreviousWeek={copyRosterFromPreviousWeek}
        onCreate={submitPromoter}
      />
    )}
  </section>;
}
function PromoterMenu({promoterId,editing,onAdd,onRemove}:{promoterId:string;editing:boolean;onAdd:()=>void;onRemove:()=>void}) { return <details className="relative"><summary className="list-none"><Button size="sm" variant="ghost"><MoreHorizontal/>Ações</Button></summary><div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border bg-[var(--mk-card)] p-1 text-xs shadow-xl">{editing && <><button className="w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--mk-hover)]" onClick={onAdd}>Adicionar visita</button><button className="w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--mk-hover)]" onClick={onRemove}>Remover da semana</button></>}<Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[var(--mk-hover)]" href={`/dashboard/promotores/${promoterId}`}><ExternalLink className="h-3.5 w-3.5"/>Ver cadastro</Link></div></details>; }
function RouteRow({item,index,editing,selected,conflict,options,onSelect,onEdit,onMove,onDuplicate,onDelete}:{item:DraftGroup;index:number;editing:boolean;selected:boolean;conflict:boolean;options:Options;onSelect:(v:boolean)=>void;onEdit:()=>void;onMove:()=>void;onDuplicate:()=>void;onDelete:()=>void}) { const store=options.stores.find(x=>x.id===item.storeId); const industries=item.industryIds.map(id=>options.industries.find(x=>x.id===id)?.name).filter(Boolean).join(', '); return <div className={`grid grid-cols-[auto_24px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-[10px] ${conflict?'bg-[var(--mk-warning-soft)]':''}`}>{editing?<input aria-label="Selecionar visita" type="checkbox" checked={selected} onChange={e=>onSelect(e.target.checked)}/>:<GripVertical className="h-3 w-3 text-[var(--mk-text-subtle)]"/>}<span className="font-mono text-[var(--mk-text-subtle)]">{String(item.routeOrder||index+1).padStart(2,'0')}</span><div className="min-w-0"><p className="truncate font-semibold">{store?.name||'Loja não identificada'}</p><p className="truncate text-[var(--mk-text-subtle)]">{industries}{item.plannedTime&&` · ${item.plannedTime}`}</p>{conflict&&<p className="text-[var(--mk-warning)]">Conflito operacional</p>}</div><details className="relative"><summary className="list-none rounded-md p-1 hover:bg-[var(--mk-hover)]"><MoreHorizontal className="h-3.5 w-3.5"/></summary><div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border bg-[var(--mk-card)] p-1 shadow-xl">{editing?<><button className="w-full px-2 py-1.5 text-left" onClick={onEdit}>Editar</button><button className="w-full px-2 py-1.5 text-left" onClick={onEdit}>Adicionar indústria</button><button className="w-full px-2 py-1.5 text-left" onClick={onMove}>Mover para outro dia</button><button className="w-full px-2 py-1.5 text-left" onClick={onDuplicate}>Duplicar</button><button className="w-full px-2 py-1.5 text-left text-[var(--mk-danger)]" onClick={onDelete}>Excluir do roteiro</button></>:<button className="w-full px-2 py-1.5 text-left" onClick={onEdit}>Ver detalhes</button>}</div></details></div>; }
function RouteForm({ form, setForm, storeQuery, setStoreQuery, options, draft, onCancel, onSave }: { form: DraftGroup; setForm: (value: DraftGroup) => void; storeQuery: string; setStoreQuery: (value: string) => void; options: Options; draft: DraftGroup[]; onCancel: () => void; onSave: () => void }) {
  const stores = options.stores.filter((item) => `${item.name} ${item.chain || ''} ${item.city || ''} ${item.state || ''} ${item.address || ''}`.toLocaleLowerCase('pt-BR').includes(storeQuery.toLocaleLowerCase('pt-BR'))).slice(0, 20);
  const sameDay = draft.filter((item) => item.promoterId === form.promoterId && dateKey(item.scheduledDate) === dateKey(form.scheduledDate) && item.key !== form.key);
  const conflict = sameDay.some((item) => item.storeId !== form.storeId && item.industryIds.some((id) => form.industryIds.includes(id)));
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button className="fixed inset-0 bg-black/60" onClick={onCancel} /><div role="dialog" aria-modal="true" className="mk-dialog relative z-10 max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border p-6"><div><h3 className="font-bold">{form.ids.length ? 'Editar visita do roteiro' : 'Adicionar visita'}</h3><p className="text-xs text-[var(--mk-text-subtle)]">As alterações permanecerão no rascunho até salvar a semana.</p></div>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Promotor"><select value={form.promoterId} onChange={(event) => setForm({ ...form, promoterId: event.target.value })}>{allPromoters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Dia"><input type="date" value={dateKey(form.scheduledDate)} onChange={(event) => setForm({ ...form, scheduledDate: `${event.target.value}T12:00:00.000Z` })} /></Field><Field label="Ordem"><input type="number" min={1} value={form.routeOrder} onChange={(event) => setForm({ ...form, routeOrder: Number(event.target.value) })} /></Field><Field label="Frequência semanal"><input type="number" min={1} value={form.weeklyFrequency} onChange={(event) => setForm({ ...form, weeklyFrequency: Number(event.target.value) })} /></Field><Field label="Horário previsto"><input type="time" value={form.plannedTime} onChange={(event) => setForm({ ...form, plannedTime: event.target.value })} /></Field><Field label="Duração estimada (min)"><input type="number" min={1} value={form.estimatedDurationMinutes ?? ''} onChange={(event) => setForm({ ...form, estimatedDurationMinutes: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="Status"><select value={form.status} disabled={form.status !== 'PLANEJADA'} onChange={(event) => setForm({ ...form, status: event.target.value as Visit['status'] })}><option value="PLANEJADA">Planejada</option><option value="CANCELADA">Cancelada</option></select></Field></div>
    <div><label className="text-xs font-semibold">Indústrias</label><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{options.industries.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-lg border p-2 text-xs"><input type="checkbox" checked={form.industryIds.includes(item.id)} onChange={(event) => setForm({ ...form, industryIds: event.target.checked ? [...form.industryIds, item.id] : form.industryIds.filter((id) => id !== item.id) })} />{item.name}</label>)}</div></div>
    <div><label className="text-xs font-semibold">Buscar loja</label><input value={storeQuery} onChange={(event) => setStoreQuery(event.target.value)} placeholder="Nome, rede, cidade, endereço ou UF" className="mt-2 h-10 w-full rounded-xl border px-3 text-xs" /><div className="mt-2 max-h-40 overflow-y-auto rounded-xl border">{stores.map((item) => { const existing = sameDay.find((entry) => entry.storeId === item.id); return <button key={item.id} onClick={() => setForm({ ...form, storeId: item.id })} className={`block w-full border-b p-2 text-left text-xs ${form.storeId === item.id ? 'bg-[var(--mk-hover)]' : ''}`}><strong>{item.name}</strong><span className="block text-[10px] text-[var(--mk-text-subtle)]">{item.city || 'Cidade não informada'} - {item.state || 'UF'} · {existing ? 'Já atendida neste dia' : 'Sem visita neste dia'}</span></button>; })}</div></div>
    <Field label="Observação"><textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
    {conflict && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"><strong>Este promotor já atende outra indústria em outra loja neste dia.</strong><Field label="Justificativa administrativa"><textarea rows={2} value={form.conflictJustification} onChange={(event) => setForm({ ...form, conflictJustification: event.target.value })} /></Field></div>}
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button disabled={!form.industryIds.length || (conflict && !form.conflictJustification.trim())} onClick={onSave}><Check />Adicionar ao rascunho</Button></div>
  </div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1 text-xs font-semibold">{label}<span className="block [&_input]:h-10 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:px-3 [&_select]:h-10 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:px-3 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:p-3">{children}</span></label>; }
