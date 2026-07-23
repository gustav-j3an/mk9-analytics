import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type OperationCleanupSelection = {
  routes: boolean;
  visits: boolean;
  evidences: boolean;
  reconciliations: boolean;
  imports: boolean;
};

export type OperationCleanupCounts = {
  routes: number;
  visits: number;
  evidences: number;
  reconciliations: number;
  imports: number;
  files: number;
  previews: number;
  confirmations: number;
};

export type OperationCleanupPreview = {
  operation: { id: string; name: string };
  removable: OperationCleanupCounts;
  preserved: { stores: number; promoters: number; industries: number };
  unsafeReasons: string[];
};

export class OperationCleanupError extends Error {
  constructor(
    public readonly code: 'OPERATION_NOT_FOUND' | 'OPERATION_CLEANUP_UNSAFE' | 'OPERATION_CLEANUP_FAILED',
    public readonly status: 404 | 409 | 500,
    message: string,
  ) {
    super(message);
    this.name = 'OperationCleanupError';
  }
}

const cleanupSelect = {
  id: true,
  name: true,
  visits: { select: { id: true, status: true, storeId: true, promoterId: true, industryId: true } },
  promoters: { select: { id: true } },
  imports: {
    select: {
      id: true,
      _count: { select: { files: true, previewArtifacts: true, confirmations: true } },
    },
  },
  evidences: { select: { id: true, importId: true, audits: { select: { id: true } } } },
} satisfies Prisma.OperationSelect;

type CleanupRecord = Prisma.OperationGetPayload<{ select: typeof cleanupSelect }>;

export function buildCleanupPreview(record: CleanupRecord, selection?: OperationCleanupSelection): OperationCleanupPreview {
  const removable = {
    routes: record.visits.filter((item) => item.status === 'PLANEJADA').length,
    visits: record.visits.filter((item) => item.status !== 'PLANEJADA').length,
    evidences: record.evidences.length,
    reconciliations: record.evidences.reduce((total, item) => total + item.audits.length, 0),
    imports: record.imports.length,
    files: record.imports.reduce((total, item) => total + item._count.files, 0),
    previews: record.imports.reduce((total, item) => total + item._count.previewArtifacts, 0),
    confirmations: record.imports.reduce((total, item) => total + item._count.confirmations, 0),
  };
  const unsafeReasons: string[] = [];
  if (selection?.imports && !selection.evidences && record.evidences.some((item) => record.imports.some((entry) => entry.id === item.importId))) {
    unsafeReasons.push('Para remover importações, selecione também as evidências vinculadas.');
  }
  return {
    operation: { id: record.id, name: record.name },
    removable,
    preserved: {
      stores: new Set(record.visits.map((item) => item.storeId)).size,
      promoters: new Set([...record.promoters.map((item) => item.id), ...record.visits.map((item) => item.promoterId)]).size,
      industries: new Set(record.visits.map((item) => item.industryId)).size,
    },
    unsafeReasons,
  };
}

export function selectedCleanupCount(preview: OperationCleanupPreview, selection: OperationCleanupSelection): number {
  return (selection.routes ? preview.removable.routes : 0)
    + (selection.visits ? preview.removable.visits : 0)
    + (selection.evidences ? preview.removable.evidences : 0)
    + (selection.reconciliations && !selection.evidences ? preview.removable.reconciliations : 0)
    + (selection.imports ? preview.removable.imports : 0);
}

export async function getOperationCleanupPreview(id: string, selection?: OperationCleanupSelection) {
  const record = await prisma.operation.findUnique({ where: { id }, select: cleanupSelect });
  if (!record) throw new OperationCleanupError('OPERATION_NOT_FOUND', 404, 'Operação não encontrada.');
  return buildCleanupPreview(record, selection);
}

export async function cleanOperation(id: string, selection: OperationCleanupSelection) {
  try {
    return await prisma.$transaction(async (tx) => {
      const record = await tx.operation.findUnique({ where: { id }, select: cleanupSelect });
      if (!record) throw new OperationCleanupError('OPERATION_NOT_FOUND', 404, 'Operação não encontrada.');
      const before = buildCleanupPreview(record, selection);
      if (before.unsafeReasons.length) throw new OperationCleanupError('OPERATION_CLEANUP_UNSAFE', 409, before.unsafeReasons[0]);

      const selectedVisitIds = record.visits
        .filter((item) => (selection.routes && item.status === 'PLANEJADA') || (selection.visits && item.status !== 'PLANEJADA'))
        .map((item) => item.id);

      if (selection.reconciliations && !selection.evidences) {
        await tx.reconciliationAudit.deleteMany({ where: { evidence: { operationId: id } } });
      }
      if (selection.evidences) {
        await tx.reconciliationAudit.deleteMany({ where: { evidence: { operationId: id } } });
        await tx.visitEvidence.deleteMany({ where: { operationId: id } });
      } else if (selectedVisitIds.length) {
        await tx.visitEvidence.updateMany({ where: { operationId: id, visitId: { in: selectedVisitIds } }, data: { visitId: null } });
      }
      if (selectedVisitIds.length) await tx.visit.deleteMany({ where: { id: { in: selectedVisitIds }, operationId: id } });

      if (selection.imports) {
        const importIds = record.imports.map((item) => item.id);
        const remainingEvidence = await tx.visitEvidence.count({ where: { importId: { in: importIds } } });
        if (remainingEvidence) throw new OperationCleanupError('OPERATION_CLEANUP_UNSAFE', 409, 'Ainda existem evidências vinculadas às importações selecionadas.');
        await tx.importConfirmation.deleteMany({ where: { importId: { in: importIds } } });
        await tx.importPreviewArtifact.deleteMany({ where: { importId: { in: importIds } } });
        await tx.importFile.deleteMany({ where: { importId: { in: importIds } } });
        await tx.import.deleteMany({ where: { id: { in: importIds }, operationId: id } });
      }

      // Preserva os cadastros: somente remove o vínculo administrativo direto.
      const promotersUnlinked = (await tx.promoter.updateMany({ where: { operationId: id }, data: { operationId: null } })).count;

      const afterRecord = await tx.operation.findUnique({ where: { id }, select: cleanupSelect });
      if (!afterRecord) throw new OperationCleanupError('OPERATION_NOT_FOUND', 404, 'Operação não encontrada.');
      const after = buildCleanupPreview(afterRecord);
      await tx.syncLog.create({
        data: {
          action: 'OPERATION_CLEANUP',
          status: 'SUCCESS',
          message: `Limpeza administrativa da operação ${record.name}.`,
          details: {
            operationId: id,
            operationName: record.name,
            actor: 'ADMIN_DEV',
            origin: 'MANUAL',
            selection,
            before: before.removable,
            after: after.removable,
            preserved: before.preserved,
            promotersUnlinked,
          },
        },
      });
      return { success: true as const, selection, before, after, promotersUnlinked };
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof OperationCleanupError) throw error;
    console.error('[operations:cleanup] unexpected error', { name: error instanceof Error ? error.name : 'UnknownError', message: error instanceof Error ? error.message : String(error) });
    throw new OperationCleanupError('OPERATION_CLEANUP_FAILED', 500, 'Não foi possível limpar a operação.');
  }
}
