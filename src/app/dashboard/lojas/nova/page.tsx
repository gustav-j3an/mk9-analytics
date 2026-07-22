import { PageHeader } from '@/components/ui/PageHeader';
import { StoreForm } from '@/modules/stores/components/StoreForm';
export default function NewStorePage(){return <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8"><PageHeader category="Lojas" title="Nova loja" subtitle="Cadastre a identificação e localização da loja."/><StoreForm/></main>}
