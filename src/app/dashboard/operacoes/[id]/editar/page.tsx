import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { OperationForm } from '@/components/operations/OperationForm';
import { operationService } from '@/modules/operations/services/OperationService';

export default async function EditarOperacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let operation;
  try { operation = await operationService.getOperationById(id); } catch { notFound(); }
  const date = (value: Date) => value.toISOString().slice(0, 10);
  return <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8"><PageHeader category="Operacoes" title="Editar operacao" subtitle={operation.name} /><OperationForm initial={{ id: operation.id, name: operation.name, clientId: operation.clientId || '', description: operation.description || '', observations: operation.observations || '', startsAt: date(operation.startsAt), endsAt: date(operation.endsAt), status: operation.status }} /></main>;
}
