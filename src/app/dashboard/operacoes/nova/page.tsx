import { PageHeader } from '@/components/ui/PageHeader';
import { OperationForm } from '@/components/operations/OperationForm';

export default function NovaOperacaoPage() {
  return <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8"><PageHeader category="Operacoes" title="Nova operacao" subtitle="Cadastre o periodo, cliente e dados comerciais da operacao." /><OperationForm /></main>;
}
