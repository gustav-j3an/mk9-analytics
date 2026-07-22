'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type StoreFormData = { id?: string; code: string; name: string; chain?: string | null; address?: string | null; city?: string | null; state?: string | null };

export function StoreForm({ initial }: { initial?: StoreFormData }) {
  const router = useRouter(); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  async function submit(formData: FormData) {
    setSaving(true); setError('');
    const payload = Object.fromEntries(['code', 'name', 'chain', 'address', 'city', 'state'].map((key) => [key, formData.get(key)]));
    const response = await fetch(initial?.id ? `/api/stores/${initial.id}` : '/api/stores', { method: initial?.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || 'Não foi possível salvar a loja.'); setSaving(false); return; }
    router.push(`/dashboard/lojas/${result.id}`); router.refresh();
  }
  const field='h-10 w-full rounded-md border border-[#e4e4e0] bg-white px-3 text-sm outline-none focus:border-[#888883]';
  return <form action={submit} className="grid gap-5 rounded-lg border bg-white p-5 md:grid-cols-2">
    <Field label="Código"><input required name="code" defaultValue={initial?.code} className={field} /></Field>
    <Field label="Nome"><input required name="name" defaultValue={initial?.name} className={field} /></Field>
    <Field label="Rede / bandeira"><input name="chain" defaultValue={initial?.chain || ''} className={field} /></Field>
    <Field label="Endereço"><input name="address" defaultValue={initial?.address || ''} className={field} /></Field>
    <Field label="Cidade"><input name="city" defaultValue={initial?.city || ''} className={field} /></Field>
    <Field label="UF"><input name="state" maxLength={2} defaultValue={initial?.state || ''} className={field} /></Field>
    {error && <p className="text-sm text-red-700 md:col-span-2">{error}</p>}
    <div className="flex gap-3 md:col-span-2"><button disabled={saving} className="rounded-md bg-[#20201f] px-4 py-2.5 text-xs font-medium text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar loja'}</button><button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2.5 text-xs">Cancelar</button></div>
  </form>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="text-xs font-medium">{label}</span>{children}</label>; }
