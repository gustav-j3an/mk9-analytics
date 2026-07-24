interface VisitsFiltersProps { promoter?: string; supervisor?: string; status?: string; startDate?: string; endDate?: string; industry?: string; store?: string; uniquePromoters: string[]; uniqueSupervisors: string[]; uniqueIndustries: string[]; uniqueStores: string[] }

export function VisitsFilters({ promoter = '', supervisor = '', status = '', startDate = '', endDate = '', industry = '', store = '', uniquePromoters, uniqueSupervisors, uniqueIndustries, uniqueStores }: VisitsFiltersProps) {
  const field = 'h-9 min-w-0 w-full rounded-md border border-[#d9d9d4] bg-white px-3 text-xs text-[#393937] outline-none focus:border-[#999994]';
  return <details className="rounded-md border border-[#deded9] bg-white" open={Boolean(promoter || supervisor || status || startDate || endDate || industry || store)}><summary className="cursor-pointer select-none px-4 py-3 text-xs font-medium text-[#4f4f4b]">Filtros de visitas</summary><form method="GET" action="/dashboard/visitas" className="grid gap-3 border-t border-[#e7e7e3] p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    <Field label="Promotor"><select name="promoter" defaultValue={promoter} className={field}><option value="">Todos</option>{uniquePromoters.map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Supervisor"><select name="supervisor" defaultValue={supervisor} className={field}><option value="">Todos</option>{uniqueSupervisors.map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Indústria"><select name="industry" defaultValue={industry} className={field}><option value="">Todas</option>{uniqueIndustries.map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Loja"><select name="store" defaultValue={store} className={field}><option value="">Todas</option>{uniqueStores.map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Status"><select name="status" defaultValue={status} className={field}><option value="">Todos</option><option value="PLANEJADA">Planejada</option><option value="REALIZADA">Realizada</option><option value="CANCELADA">Cancelada</option></select></Field>
    <Field label="Início"><input type="date" name="startDate" defaultValue={startDate} className={field} /></Field><Field label="Fim"><input type="date" name="endDate" defaultValue={endDate} className={field} /></Field>
    <div className="flex gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-6 xl:justify-end"><a href="/dashboard/visitas" className="flex h-9 items-center rounded-md border border-[#d9d9d4] px-3 text-xs text-[#62625e]">Limpar</a><button className="h-9 rounded-md bg-[#20201f] px-4 text-xs font-medium text-white">Aplicar filtros</button></div>
  </form></details>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="min-w-0 space-y-1.5"><span className="block text-[11px] text-[#73736f]">{label}</span>{children}</label>; }
export default VisitsFilters;
