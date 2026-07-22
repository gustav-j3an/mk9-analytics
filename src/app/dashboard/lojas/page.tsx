import Link from 'next/link';
import { Search, Store } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { storeService } from '@/modules/stores/services/StoreService';

export const dynamic='force-dynamic';
type Params={ q?:string; uf?:string; city?:string; operationId?:string; archived?:'active'|'archived'|'all'; page?:string };
export default async function StoresPage({ searchParams }: { searchParams:Promise<Params> }) {
  const params=await searchParams; const page=Math.max(1, Number(params.page)||1);
  const [result, options]=await Promise.all([storeService.getStores({ page, limit:15, search:params.q, state:params.uf, city:params.city, operationId:params.operationId, archived:params.archived }), storeService.getFilterOptions()]);
  const href=(next:number)=>`?${new URLSearchParams(Object.entries({...params,page:String(next)}).filter(([,v])=>v) as [string,string][]).toString()}`;
  const field='h-9 rounded-md border bg-white px-3 text-xs';
  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
    <PageHeader category="Cadastros" title="Lojas" subtitle="Cadastro e acompanhamento das lojas atendidas." actions={<Link href="/dashboard/lojas/nova" className="rounded-md bg-[#20201f] px-4 py-2.5 text-xs font-medium text-white">Nova loja</Link>} />
    <section className="flex flex-col gap-4 rounded-lg border bg-white p-4 lg:flex-row lg:items-center"><div className="flex items-center gap-3 lg:border-r lg:pr-5"><Store className="h-5 w-5"/><div><p className="text-[10px] uppercase text-[#777772]">Encontradas</p><p className="text-xl font-bold">{result.pagination.total}</p></div></div>
      <form className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-6"><label className="relative lg:col-span-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#999]"/><input name="q" defaultValue={params.q} placeholder="Buscar nome..." className={`${field} w-full pl-9`}/></label>
      <select name="uf" defaultValue={params.uf||''} className={field}><option value="">Todas as UFs</option>{options.states.map(x=><option key={x}>{x}</option>)}</select>
      <select name="city" defaultValue={params.city||''} className={field}><option value="">Todas as cidades</option>{options.cities.map(x=><option key={x}>{x}</option>)}</select>
      <select name="operationId" defaultValue={params.operationId||''} className={field}><option value="">Todas as operações</option>{options.operations.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select name="archived" defaultValue={params.archived||'active'} className={field}><option value="active">Ativas</option><option value="archived">Arquivadas</option><option value="all">Todas</option></select>
      <div className="flex gap-2 lg:col-span-6 lg:justify-end"><button className="rounded-md bg-[#20201f] px-4 py-2 text-xs text-white">Filtrar</button><Link href="/dashboard/lojas" className="rounded-md border px-4 py-2 text-xs">Limpar</Link></div></form></section>
    {result.items.length===0?<EmptyState title="Nenhuma loja encontrada" description="Ajuste os filtros ou cadastre uma nova loja."/>:<section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="border-b bg-[#fafaf8] text-[#777772]"><tr>{['Loja','Código','Cidade/UF','Operações','Visitas','Status',''].map(x=><th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead><tbody className="divide-y">{result.items.map(item=><tr key={item.id}><td className="px-4 py-3 font-semibold">{item.name}<div className="font-normal text-[#777772]">{item.chain||'Sem rede'}</div></td><td className="px-4 py-3">{item.code}</td><td className="px-4 py-3">{item.city||'-'} / {item.state||'-'}</td><td className="px-4 py-3">{item.visits.map(v=>v.operation.name).join(', ')||'-'}</td><td className="px-4 py-3">{item._count.visits}</td><td className="px-4 py-3">{item.archivedAt?'Arquivada':'Ativa'}</td><td className="px-4 py-3 text-right"><Link href={`/dashboard/lojas/${item.id}`} className="font-medium underline">Detalhes</Link></td></tr>)}</tbody></table></div></section>}
    <nav className="flex items-center justify-between text-xs"><span>Página {result.pagination.page} de {Math.max(1,result.pagination.pages)}</span><div className="flex gap-2">{page>1&&<Link className="rounded-md border px-3 py-2" href={href(page-1)}>Anterior</Link>}{page<result.pagination.pages&&<Link className="rounded-md border px-3 py-2" href={href(page+1)}>Próxima</Link>}</div></nav>
  </main>;
}
