import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PREVIEW_DURATION_MS } from './ImportPreviewArtifactService';

export type ImportDeleteErrorCode =
  | 'IMPORT_NOT_FOUND'
  | 'IMPORT_PROCESSING_ACTIVE'
  | 'IMPORT_DELETE_FORBIDDEN'
  | 'IMPORT_DELETE_FAILED';

export class ImportDeleteError extends Error {
  constructor(
    public readonly code: ImportDeleteErrorCode,
    public readonly httpStatus: 403 | 404 | 409 | 500,
    message: string,
  ) {
    super(message);
    this.name = 'ImportDeleteError';
  }
}

export interface ImportDeletionCounts {
  imports: number;
  files: number;
  previews: number;
  confirmations: number;
  evidences: number;
  reconciliationAudits: number;
  visits: number;
  stores: number;
  industries: number;
  promoters: number;
  operations: number;
}

export interface ImportDeletionResult {
  success: true;
  importId: string;
  alreadyDeleted: boolean;
  removed: ImportDeletionCounts;
}

export interface ImportDeletionStore {
  findCompletedByIdempotencyKey(key: string): Promise<ImportDeletionResult | null>;
  transaction<T>(work: (tx: ImportDeletionTransaction) => Promise<T>): Promise<T>;
}

export interface ImportDeletionTransaction {
  findImport(id: string): Promise<{
    id: string;
    status: string;
    operationId: string | null;
    createdAt: Date;
    updatedAt: Date;
    files: Array<{ fileName: string }>;
    previewArtifacts: Array<{ expiresAt: Date; consumedAt: Date | null }>;
  } | null>;
  countDependencies(id: string): Promise<Omit<ImportDeletionCounts, 'imports' | 'visits' | 'stores' | 'industries' | 'promoters' | 'operations'>>;
  deleteDependencies(id: string): Promise<void>;
  deleteImport(id: string): Promise<void>;
  writeAudit(input: {
    importId: string;
    fileName: string;
    actor: string;
    reason?: string;
    idempotencyKey: string;
    counts: ImportDeletionCounts;
  }): Promise<void>;
}

const zeroOperationalCounts = {
  visits: 0,
  stores: 0,
  industries: 0,
  promoters: 0,
  operations: 0,
} as const;

function resultFromDetails(details: unknown): ImportDeletionResult | null {
  if (!details || typeof details !== 'object') return null;
  const value = details as { importId?: unknown; counts?: unknown; result?: unknown };
  if (typeof value.importId !== 'string' || value.result !== 'SUCCESS' || !value.counts) return null;
  return {
    success: true,
    importId: value.importId,
    alreadyDeleted: true,
    removed: value.counts as ImportDeletionCounts,
  };
}

export const prismaImportDeletionStore: ImportDeletionStore = {
  findCompletedByIdempotencyKey: async (key) => {
    const log = await prisma.syncLog.findFirst({
      where: { action: 'IMPORT_RECORD_DELETE', status: 'SUCCESS', details: { path: ['idempotencyKey'], equals: key } },
      orderBy: { createdAt: 'desc' },
      select: { details: true },
    });
    return resultFromDetails(log?.details);
  },
  transaction: (work) => prisma.$transaction(async (tx) => work({
    findImport: (id) => tx.import.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        operationId: true,
        createdAt: true,
        updatedAt: true,
        files: { select: { fileName: true }, take: 1 },
        previewArtifacts: { select: { expiresAt: true, consumedAt: true } },
      },
    }),
    countDependencies: async (id) => {
      const [files, previews, confirmations, evidences, reconciliationAudits] = await Promise.all([
        tx.importFile.count({ where: { importId: id } }),
        tx.importPreviewArtifact.count({ where: { importId: id } }),
        tx.importConfirmation.count({ where: { importId: id } }),
        tx.visitEvidence.count({ where: { importId: id } }),
        tx.reconciliationAudit.count({ where: { evidence: { importId: id } } }),
      ]);
      return { files, previews, confirmations, evidences, reconciliationAudits };
    },
    deleteDependencies: async (id) => {
      await tx.reconciliationAudit.deleteMany({ where: { evidence: { importId: id } } });
      await tx.visitEvidence.deleteMany({ where: { importId: id } });
      await tx.importConfirmation.deleteMany({ where: { importId: id } });
      await tx.importPreviewArtifact.deleteMany({ where: { importId: id } });
      await tx.importFile.deleteMany({ where: { importId: id } });
    },
    deleteImport: (id) => tx.import.delete({ where: { id } }).then(() => undefined),
    writeAudit: async ({ importId, fileName, actor, reason, idempotencyKey, counts }) => {
      await tx.syncLog.create({
        data: {
          action: 'IMPORT_RECORD_DELETE',
          status: 'SUCCESS',
          message: `Registro da importação ${fileName} excluído manualmente.`,
          details: {
            importId,
            fileName,
            actor,
            reason: reason || null,
            origin: 'MANUAL',
            result: 'SUCCESS',
            idempotencyKey,
            counts: { ...counts },
            before: { import: 1, ...counts },
            after: { import: 0, ...zeroOperationalCounts },
          } satisfies Prisma.InputJsonValue,
        },
      });
    },
  }), { isolationLevel: 'Serializable' }),
};

export async function deleteImportRecord(
  input: { id: string; confirmation: string; actor: string; reason?: string; idempotencyKey: string },
  store: ImportDeletionStore = prismaImportDeletionStore,
  now: Date = new Date(),
): Promise<ImportDeletionResult> {
  if (input.confirmation !== 'EXCLUIR') {
    throw new ImportDeleteError('IMPORT_DELETE_FORBIDDEN', 403, 'Confirmação de exclusão inválida.');
  }
  const completed = await store.findCompletedByIdempotencyKey(input.idempotencyKey);
  if (completed) return completed;

  try {
    return await store.transaction(async (tx) => {
      const record = await tx.findImport(input.id);
      if (!record) throw new ImportDeleteError('IMPORT_NOT_FOUND', 404, 'Importação não encontrada.');
      if (isImportProcessingActive(record, now)) {
        throw new ImportDeleteError('IMPORT_PROCESSING_ACTIVE', 409, 'A importação ainda está em processamento.');
      }
      const dependent = await tx.countDependencies(input.id);
      const counts: ImportDeletionCounts = { imports: 1, ...dependent, ...zeroOperationalCounts };
      await tx.deleteDependencies(input.id);
      await tx.deleteImport(input.id);
      await tx.writeAudit({
        importId: input.id,
        fileName: record.files[0]?.fileName ?? 'Arquivo não identificado',
        actor: input.actor,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
        counts,
      });
      return { success: true, importId: input.id, alreadyDeleted: false, removed: counts };
    });
  } catch (error) {
    if (error instanceof ImportDeleteError) throw error;
    console.error('[imports:delete] unexpected error', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    });
    throw new ImportDeleteError('IMPORT_DELETE_FAILED', 500, 'Não foi possível excluir o registro da importação.');
  }
}

export function isImportProcessingActive(
  record: {
    status: string;
    updatedAt: Date;
    previewArtifacts: Array<{ expiresAt: Date; consumedAt: Date | null }>;
  },
  now: Date = new Date(),
): boolean {
  if (record.status === 'PERSISTING') return true;
  if (record.status !== 'PROCESSING') return false;

  // A existência de um preview significa que o processamento do arquivo acabou.
  // Ele pode estar pendente ou expirado, ambos removíveis sem validar token.
  if (record.previewArtifacts.length > 0) return false;

  // Um PROCESSING sem preview só é considerado ativo durante a janela máxima
  // normal do preview. Depois disso é um processamento órfão e pode ser limpo.
  return record.updatedAt.getTime() + PREVIEW_DURATION_MS > now.getTime();
}

export const unsafeRollbackPreview = {
  safe: false,
  code: 'IMPORT_ROLLBACK_UNSAFE',
  reason: 'Não disponível: os registros desta importação não possuem rastreabilidade exclusiva.',
  counts: {
    visits: 0,
    evidences: 0,
    reconciliations: 0,
    links: 0,
    exclusiveStores: 0,
    exclusiveIndustries: 0,
    exclusivePromoters: 0,
    sharedRecordsPreserved: 0,
  },
} as const;
