'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type OperationFormData = {
  id?: string; name: string; clientId: string; description: string; observations: string;
  startsAt: string; endsAt: string; status: string;
};

export function OperationForm({ initial }: { initial?: OperationFormData }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(formData: FormData) {
    setSaving(true); setError('');
    const startsAt = String(formData.get('startsAt'));
    const start = new Date(`${startsAt}T12:00:00.000Z`);
    const payload = {
      name: formData.get('name'), clientId: formData.get('clientId') || undefined,
      description: formData.get('description') || undefined, observations: formData.get('observations') || undefined,
      startsAt: start.toISOString(), endsAt: new Date(`${formData.get('endsAt')}T12:00:00.000Z`).toISOString(),
      month: start.getUTCMonth() + 1, year: start.getUTCFullYear(), status: formData.get('status'),
    };
    const url = initial?.id ? `/api/operations?id=${initial.id}` : '/api/operations';
    const response = await fetch(url, { method: initial?.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || 'Nao foi possivel salvar.'); setSaving(false); return; }
    router.push(`/dashboard/operacoes/${result.id}`); router.refresh();
  }

  const field = 'h-10 w-full rounded-md border bg-white px-3 text-sm';
  return <form action={submit} className="grid gap-5 rounded-md border bg-white p-5 md:grid-cols-2">
    <Field label="Nome"><input required name="name" defaultValue={initial?.name} className={field} /></Field>
    <Field label="Cliente"><input name="clientId" defaultValue={initial?.clientId} className={field} /></Field>
    <Field label="Data de inicio"><input required type="date" name="startsAt" defaultValue={initial?.startsAt} className={field} /></Field>
    <Field label="Data de termino"><input required type="date" name="endsAt" defaultValue={initial?.endsAt} className={field} /></Field>
    <Field label="Status"><select name="status" defaultValue={initial?.status || 'PLANNING'} className={field}><option value="PLANNING">Planejada</option><option value="OPEN">Ativa</option><option value="IN_PROGRESS">Em andamento</option><option value="FINISHED">Finalizada</option><option value="ARCHIVED">Arquivada</option></select></Field>
    <div />
    <Field label="Descricao" wide><textarea name="description" defaultValue={initial?.description} className="min-h-24 w-full rounded-md border p-3 text-sm" /></Field>
    <Field label="Observacoes" wide><textarea name="observations" defaultValue={initial?.observations} className="min-h-24 w-full rounded-md border p-3 text-sm" /></Field>
    {error && <p className="text-sm text-red-700 md:col-span-2">{error}</p>}
    <div className="flex gap-3 md:col-span-2"><button disabled={saving} className="rounded-md bg-[#20201f] px-4 py-2.5 text-xs font-medium text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar operacao'}</button><button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2.5 text-xs">Cancelar</button></div>
  </form>;
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}><span className="text-xs font-medium">{label}</span>{children}</label>; }
