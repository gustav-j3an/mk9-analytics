import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { StoreForm } from '@/modules/stores/components/StoreForm';
import { storeService } from '@/modules/stores/services/StoreService';
export const dynamic='force-dynamic';
export default async function EditStorePage({params}:{params:Promise<{id:string}>}){try{const store=await storeService.getStoreById((await params).id);return <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8"><PageHeader category="Lojas" title={`Editar ${store.name}`} subtitle="Atualize os dados cadastrais da loja."/><StoreForm initial={store}/></main>}catch{notFound()}}
