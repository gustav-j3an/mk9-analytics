import { OperationStatus, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type OperationImpact = {
  stores: number;
  promoters: number;
  industries: number;
  visits: number;
  imports: number;
  reconciliations: number;
  evidences: number;
  routes: number;
};

export class OperationLifecycleError extends Error {
  constructor(
    public readonly code: 'OPERATION_NOT_FOUND' | 'OPERATION_HAS_LINKED_DATA' | 'OPERATION_DELETE_FORBIDDEN' | 'OPERATION_DELETE_FAILED',
    public readonly status: 403 | 404 | 409 | 500,
    message: string,
    public readonly impact?: OperationImpact,
  ) {
    super(message);
    this.name = 'OperationLifecycleError';
  }
}

const impactSelect = {
  id: true,
  name: true,
  visits: { select: { storeId: true, promoterId: true, industryId: true } },
  promoters: { select: { id: true } },
  imports: { select: { id: true } },
  evidences: { select: { id: true, result: true } },
} satisfies Prisma.OperationSelect;

export function operationImpact(record: {
  visits: Array<{ storeId: string; promoterId: string; industryId: string }>;
  promoters: Array<{ id: string }>;
  imports: Array<{ id: string }>;
  evidences: Array<{ id: string; result: string }>;
}): OperationImpact {
  const promoterIds = new Set([...record.promoters.map((item) => item.id), ...record.visits.map((item) => item.promoterId)]);
  return {
    stores: new Set(record.visits.map((item) => item.storeId)).size,
    promoters: promoterIds.size,
    industries: new Set(record.visits.map((item) => item.industryId)).size,
    visits: record.visits.length,
    imports: record.imports.length,
    reconciliations: record.evidences.filter((item) => item.result === 'MATCHED').length,
    evidences: record.evidences.length,
    routes: record.visits.length,
  };
}

export function hasLinkedOperationData(impact: OperationImpact): boolean {
  return impact.visits > 0 || impact.imports > 0 || impact.evidences > 0 || impact.reconciliations > 0 || impact.routes > 0 || impact.promoters > 0;
}

export function canConfirmOperationDeletion(canDelete: boolean, confirmation: string): boolean {
  return canDelete && confirmation === 'EXCLUIR OPERAÇÃO';
}

export function buildOperationDuplicateData(source: {
  name: string; clientId: string | null; description: string | null; observations: string | null;
}, month: number, year: number) {
  return {
    name: `${source.name} — cópia`,
    clientId: source.clientId,
    description: source.description,
    observations: source.observations,
    month,
    year,
    startsAt: new Date(Date.UTC(year, month - 1, 1, 12)),
    endsAt: new Date(Date.UTC(year, month, 0, 12)),
    status: OperationStatus.PLANNING,
  };
}

export async function getOperationDeletionPreview(id: string) {
  const operation = await prisma.operation.findUnique({ where: { id }, select: impactSelect });
  if (!operation) throw new OperationLifecycleError('OPERATION_NOT_FOUND', 404, 'Operação não encontrada.');
  const impact = operationImpact(operation);
  return { id: operation.id, name: operation.name, impact, canDelete: !hasLinkedOperationData(impact) };
}

export async function deleteEmptyOperation(id: string, confirmation: string) {
  if (confirmation !== 'EXCLUIR OPERAÇÃO') {
    throw new OperationLifecycleError('OPERATION_DELETE_FORBIDDEN', 403, 'Confirmação inválida.');
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const operation = await tx.operation.findUnique({ where: { id }, select: impactSelect });
      if (!operation) throw new OperationLifecycleError('OPERATION_NOT_FOUND', 404, 'Operação não encontrada.');
      const impact = operationImpact(operation);
      if (hasLinkedOperationData(impact)) {
        throw new OperationLifecycleError(
          'OPERATION_HAS_LINKED_DATA',
          409,
          'Esta operação possui dados vinculados. Arquive ou utilize a função de limpeza antes da exclusão.',
          impact,
        );
      }
      await tx.operation.delete({ where: { id } });
      await tx.syncLog.create({
        data: {
          action: 'OPERATION_DELETE',
          status: 'SUCCESS',
          message: `Operação ${operation.name} excluída manualmente.`,
          details: { operationId: id, operationName: operation.name, actor: 'ADMIN_DEV', origin: 'MANUAL', impact },
        },
      });
      return { success: true as const, id, impact };
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof OperationLifecycleError) throw error;
    console.error('[operations:delete] unexpected error', { name: error instanceof Error ? error.name : 'UnknownError', message: error instanceof Error ? error.message : String(error) });
    throw new OperationLifecycleError('OPERATION_DELETE_FAILED', 500, 'Não foi possível excluir a operação.');
  }
}

export async function duplicateOperationConfiguration(id: string) {
  const source = await prisma.operation.findUnique({ where: { id } });
  if (!source) throw new OperationLifecycleError('OPERATION_NOT_FOUND', 404, 'Operação não encontrada.');
  let cursor = new Date(Date.UTC(source.year, source.month, 1, 12));
  let month = cursor.getUTCMonth() + 1;
  let year = cursor.getUTCFullYear();
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const occupied = await prisma.operation.count({ where: { month, year } });
    if (!occupied) break;
    cursor = new Date(Date.UTC(year, month, 1, 12));
    month = cursor.getUTCMonth() + 1;
    year = cursor.getUTCFullYear();
    if (attempt === 35) throw new OperationLifecycleError('OPERATION_DELETE_FAILED', 500, 'Não foi possível encontrar um período livre para a cópia.');
  }
  return prisma.operation.create({
    data: buildOperationDuplicateData(source, month, year),
  });
}
