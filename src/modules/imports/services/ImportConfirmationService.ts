import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashSha256 } from './ImportPreviewArtifactService';
import type { ImportConfirmationPayload, ImportConfirmationResponse, ImportConfirmationStatus } from '../types/ImportConfirmation';
import { persistPreviewArtifact, type ImportPersistenceSummary } from './ImportPersistenceService';

export type ConfirmationErrorCode = 'PREVIEW_NOT_FOUND' | 'PREVIEW_EXPIRED' | 'PREVIEW_ALREADY_CONSUMED' | 'IDEMPOTENCY_CONFLICT' | 'OPERATION_NOT_FOUND';

export class ImportConfirmationError extends Error {
  constructor(public readonly code: ConfirmationErrorCode, public readonly httpStatus: 404 | 409 | 410, message: string) {
    super(message);
    this.name = 'ImportConfirmationError';
  }
}

export interface ArtifactRecord { id: string; importId: string; tokenHash: string; fileHash: string; payload: Prisma.JsonValue; acceptedRows: number; rejectedRows: number; expiresAt: Date; consumedAt: Date | null }
export interface ConfirmationRecord { id: string; importId: string; previewArtifactId: string; idempotencyKey: string; acceptedRows: number; rejectedRows: number; confirmedAt: Date; previewArtifact: { tokenHash: string } }
export interface ConfirmationTransaction {
  findConfirmationByKey(key: string): Promise<ConfirmationRecord | null>;
  findConfirmationByArtifact(artifactId: string): Promise<ConfirmationRecord | null>;
  findArtifactByTokenHash(tokenHash: string): Promise<ArtifactRecord | null>;
  consumeArtifact(artifactId: string, now: Date): Promise<boolean>;
  persistArtifact(artifact: ArtifactRecord): Promise<ImportPersistenceSummary>;
  linkImportToOperation(importId: string, operationId: string): Promise<boolean>;
  createConfirmation(input: { importId: string; previewArtifactId: string; idempotencyKey: string; acceptedRows: number; rejectedRows: number; confirmedAt: Date }): Promise<ConfirmationRecord>;
}
export interface ConfirmationStore {
  transaction<T>(work: (transaction: ConfirmationTransaction) => Promise<T>): Promise<T>;
  findConfirmationByKey(key: string): Promise<ConfirmationRecord | null>;
  findConfirmationByArtifact(artifactId: string): Promise<ConfirmationRecord | null>;
  findArtifactByTokenHash(tokenHash: string): Promise<ArtifactRecord | null>;
}

const confirmationInclude = { previewArtifact: { select: { tokenHash: true } } } as const;
function transactionAdapter(tx: Prisma.TransactionClient): ConfirmationTransaction {
  return {
    findConfirmationByKey: (key) => tx.importConfirmation.findUnique({ where: { idempotencyKey: key }, include: confirmationInclude }),
    findConfirmationByArtifact: (artifactId) => tx.importConfirmation.findUnique({ where: { previewArtifactId: artifactId }, include: confirmationInclude }),
    findArtifactByTokenHash: (tokenHash) => tx.importPreviewArtifact.findUnique({ where: { tokenHash } }),
    consumeArtifact: async (artifactId, now) => (await tx.importPreviewArtifact.updateMany({ where: { id: artifactId, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } })).count === 1,
    persistArtifact: (artifact) => persistPreviewArtifact(tx, artifact),
    linkImportToOperation: async (importId, operationId) => {
      const operation = await tx.operation.findUnique({ where: { id: operationId }, select: { id: true } });
      if (!operation) return false;
      await tx.import.update({ where: { id: importId }, data: { operationId } });
      return true;
    },
    createConfirmation: (input) => tx.importConfirmation.create({ data: input, include: confirmationInclude }),
  };
}
export const prismaConfirmationStore: ConfirmationStore = {
  transaction: (work) => prisma.$transaction((tx) => work(transactionAdapter(tx)), {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 60_000,
  }),
  findConfirmationByKey: (key) => prisma.importConfirmation.findUnique({ where: { idempotencyKey: key }, include: confirmationInclude }),
  findConfirmationByArtifact: (artifactId) => prisma.importConfirmation.findUnique({ where: { previewArtifactId: artifactId }, include: confirmationInclude }),
  findArtifactByTokenHash: (tokenHash) => prisma.importPreviewArtifact.findUnique({ where: { tokenHash } }),
};

function response(record: ConfirmationRecord, status: ImportConfirmationStatus, persistence?: ImportPersistenceSummary): ImportConfirmationResponse {
  return { success: true, confirmationId: record.id, importId: record.importId, status, acceptedRows: record.acceptedRows, rejectedRows: record.rejectedRows, confirmedAt: record.confirmedAt.toISOString(), persistence };
}
function idempotencyResult(record: ConfirmationRecord, tokenHash: string): ImportConfirmationResponse {
  if (record.previewArtifact.tokenHash === tokenHash) return response(record, 'ALREADY_CONFIRMED');
  throw new ImportConfirmationError('IDEMPOTENCY_CONFLICT', 409, 'A chave de idempotência já foi utilizada em outro preview.');
}
async function resolveConcurrentState(input: ImportConfirmationPayload, tokenHash: string, store: ConfirmationStore): Promise<ImportConfirmationResponse> {
  const keyed = await store.findConfirmationByKey(input.idempotencyKey);
  if (keyed) return idempotencyResult(keyed, tokenHash);
  const artifact = await store.findArtifactByTokenHash(tokenHash);
  if (!artifact) throw new ImportConfirmationError('PREVIEW_NOT_FOUND', 404, 'Preview não encontrado.');
  const existing = await store.findConfirmationByArtifact(artifact.id);
  if (existing) {
    if (existing.idempotencyKey === input.idempotencyKey) return response(existing, 'ALREADY_CONFIRMED');
    throw new ImportConfirmationError('PREVIEW_ALREADY_CONSUMED', 409, 'Este preview já foi confirmado.');
  }
  if (artifact.expiresAt.getTime() <= Date.now()) throw new ImportConfirmationError('PREVIEW_EXPIRED', 410, 'O preview expirou. Envie o arquivo novamente.');
  throw new ImportConfirmationError('PREVIEW_ALREADY_CONSUMED', 409, 'Este preview já foi consumido.');
}
class ConcurrentConfirmationError extends Error {}

export async function confirmImportPreview(input: ImportConfirmationPayload, store: ConfirmationStore = prismaConfirmationStore, now: Date = new Date()): Promise<ImportConfirmationResponse> {
  const tokenHash = hashSha256(input.previewToken);
  try {
    return await store.transaction(async (tx) => {
      const keyed = await tx.findConfirmationByKey(input.idempotencyKey);
      if (keyed) return idempotencyResult(keyed, tokenHash);
      const artifact = await tx.findArtifactByTokenHash(tokenHash);
      if (!artifact) throw new ImportConfirmationError('PREVIEW_NOT_FOUND', 404, 'Preview não encontrado.');
      if (artifact.expiresAt.getTime() <= now.getTime()) throw new ImportConfirmationError('PREVIEW_EXPIRED', 410, 'O preview expirou. Envie o arquivo novamente.');
      if (artifact.consumedAt) {
        const existing = await tx.findConfirmationByArtifact(artifact.id);
        if (existing?.idempotencyKey === input.idempotencyKey) return response(existing, 'ALREADY_CONFIRMED');
        throw new ImportConfirmationError('PREVIEW_ALREADY_CONSUMED', 409, 'Este preview já foi confirmado.');
      }
      if (!await tx.consumeArtifact(artifact.id, now)) throw new ConcurrentConfirmationError();
      if (input.operationId && !await tx.linkImportToOperation(artifact.importId, input.operationId)) {
        throw new ImportConfirmationError('OPERATION_NOT_FOUND', 404, 'Operação não encontrada.');
      }
      const persistence = await tx.persistArtifact(artifact);
      const confirmation = await tx.createConfirmation({ importId: artifact.importId, previewArtifactId: artifact.id, idempotencyKey: input.idempotencyKey, acceptedRows: artifact.acceptedRows, rejectedRows: artifact.rejectedRows, confirmedAt: now });
      return response(confirmation, 'CONFIRMED', persistence);
    });
  } catch (error: unknown) {
    if (error instanceof ImportConfirmationError) throw error;
    if (error instanceof ConcurrentConfirmationError || (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2002' || error.code === 'P2034'))) {
      return resolveConcurrentState(input, tokenHash, store);
    }
    throw error;
  }
}
