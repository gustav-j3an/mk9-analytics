import type { Prisma } from '@prisma/client';
import { canonicalize } from '@/modules/shared/normalization';
import { StoreMapper } from '@/modules/mapping/store/StoreMapper';
import { IndustryMapper } from '@/modules/mapping/industry/IndustryMapper';
import { PromoterMapper } from '@/modules/mapping/promoter/PromoterMapper';
import { OperationMapper } from '@/modules/mapping/operation/OperationMapper';
import { PersistencePlanner } from '@/modules/persistence/PersistencePlanner';
import { PersistenceEngine } from '@/modules/persistence/PersistenceEngine';
import type { VisitCandidate } from '@/modules/mapping/visit/VisitCandidate';
import type { PreviewArtifactPayload } from './ImportPreviewArtifactService';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { WeeklyPlanner } from '@/modules/routes/planning/WeeklyPlanner';
import { isVisitMarked } from '../utils/visit-markers';
import { VisitMatchRepository } from '@/modules/reconciliation/VisitMatchRepository';
import { VisitReconciliationService } from '@/modules/reconciliation/VisitReconciliationService';
import type { EvidenceInput } from '@/modules/reconciliation/ReconciliationTypes';

export interface ImportPersistenceSummary {
  createdStores: number;
  updatedStores: number;
  createdIndustries: number;
  updatedIndustries: number;
  createdPromoters: number;
  updatedPromoters: number;
  createdVisits: number;
  updatedVisits: number;
  ignoredDuplicates: number;
  ignoredInvalidRows: number;
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function developmentLog(event: string, details: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') console.info(`[imports:persistence] ${event}`, details);
}

function dateFromColumn(column: string): Date | null {
  const match = /^(\d{2})_(\d{2})_(\d{4})$/.exec(column);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12));
}

export async function persistPreviewArtifact(
  tx: Prisma.TransactionClient,
  artifact: { importId: string; fileHash: string; payload: Prisma.JsonValue; rejectedRows: number },
): Promise<ImportPersistenceSummary> {
  const payload = artifact.payload as unknown as PreviewArtifactPayload;
  const isRouteWorkbook = payload.detectedType === SpreadsheetType.ROTEIRO_PROMOTORES;
  const dateColumns = payload.columns.map((column) => ({ column, date: dateFromColumn(column) })).filter((item) => item.date !== null);
  if (!isRouteWorkbook && dateColumns.length === 0) throw new Error('O preview não contém colunas de datas persistíveis.');

  const fileName = text(payload.file.name) || 'Importação de roteiro';
  const linkedImport = await tx.import.findUnique({ where: { id: artifact.importId }, include: { operation: true } });
  let operation: { id: string; startsAt: Date; endsAt: Date };
  if (isRouteWorkbook) {
    if (!linkedImport?.operation) throw new Error('Selecione uma operação antes de confirmar uma planilha de roteiro.');
    operation = linkedImport.operation;
  } else if (linkedImport?.operation) {
    operation = linkedImport.operation;
  } else {
    const firstDate = dateColumns[0].date as Date;
    const year = firstDate.getUTCFullYear();
    const month = firstDate.getUTCMonth() + 1;
    const startsAt = new Date(Date.UTC(year, month - 1, 1, 12));
    const endsAt = new Date(Date.UTC(year, month, 0, 12));
    operation = await tx.operation.upsert({
      where: { month_year: { month, year } },
      create: { name: fileName.replace(/\.[^.]+$/, ''), month, year, startsAt, endsAt, status: 'IN_PROGRESS' },
      update: { name: fileName.replace(/\.[^.]+$/, ''), startsAt, endsAt, status: 'IN_PROGRESS' },
    });
  }

  const stores = [];
  const industries = [];
  const promoters = [];
  const visits: VisitCandidate[] = [];

  developmentLog('artifact', {
    importId: artifact.importId,
    validRows: payload.rows.length,
    dateColumns: isRouteWorkbook ? 7 : dateColumns.length,
    rejectedRows: artifact.rejectedRows,
  });

  for (const entry of payload.rows) {
    const row = entry.data as Record<string, unknown>;
    const storeName = text(row.LOJA ?? row.NOME_LOJA ?? row.STORE);
    const industryName = text(row.INDUSTRIA);
    const storeCode = text(row.CODIGO_LOJA ?? row.STORE_CODE ?? row.CODIGO) || canonicalize(storeName);
    const industryCode = text(row.CODIGO_INDUSTRIA) || canonicalize(industryName);
    const store = StoreMapper.map({ CODIGO: storeCode, NOME: storeName, CIDADE: text(row.CIDADE), UF: text(row.UF), REDE: text(row.BANDEIRA), BAIRRO: text(row.BAIRRO) });
    const industry = IndustryMapper.map({ CODIGO: industryCode, NOME: industryName });
    const promoter = PromoterMapper.map({ PROMOTOR: text(row.PROMOTOR), SUPERVISOR: text(row.SUPERVISOR) });
    stores.push(store);
    industries.push(industry);
    if (promoter) promoters.push(promoter);

    if (isRouteWorkbook) {
      if (!promoter) throw new Error(`Promotor ausente na linha ${String(entry.sourceRow ?? '')}.`);
      visits.push(...WeeklyPlanner.plan({ row, store, industry, promoter }, operation));
    } else {
      const markedDates = dateColumns.filter(({ column }) => isVisitMarked(row[column]));
      for (const { date } of markedDates) {
        const scheduledDate = date as Date;
        visits.push({
          store,
          industry,
          promoter,
          frequency: markedDates.length,
          frequencyType: 'MONTHLY',
          plannedVisitIndex: scheduledDate.getUTCDate(),
          scheduledDate,
          completed: true,
          deduplicationKey: `VISIT:${store.code}:${industry.code}:${promoter?.normalizedName ?? 'NO_PROMOTER'}:${scheduledDate.toISOString().slice(0, 10)}`,
          originalData: row,
        });
      }
    }
  }

  // Checklists are evidence of execution. Only route workbooks create planned
  // visits; evidence is reconciled against those visits after canonical entities
  // have been persisted.
  const candidate = OperationMapper.map(stores, industries, promoters, isRouteWorkbook ? visits : []);
  developmentLog('candidates', {
    stores: candidate.stores.length,
    industries: candidate.industries.length,
    promoters: candidate.promoters.length,
    visits: candidate.visits.length,
    duplicateStoresRemoved: candidate.statistics.duplicatedStores,
    duplicateIndustriesRemoved: candidate.statistics.duplicatedIndustries,
    duplicatePromotersRemoved: candidate.statistics.duplicatedPromoters,
    duplicateVisitsRemoved: candidate.statistics.duplicatedVisits,
  });
  const plan = await PersistencePlanner.plan(candidate, operation.id, tx as never);
  developmentLog('plan', {
    storesToCreate: plan.storesToCreate.length,
    storesToUpdate: plan.storesToUpdate.length,
    industriesToCreate: plan.industriesToCreate.length,
    industriesToUpdate: plan.industriesToUpdate.length,
    promotersToCreate: plan.promotersToCreate.length,
    promotersToUpdate: plan.promotersToUpdate.length,
    visitsToCreate: plan.visitsToCreate.length,
    visitsToUpdate: plan.visitsToUpdate.length,
  });
  const result = await PersistenceEngine.persist(plan, operation.id, tx as never);
  let reconciliationMatched = 0;
  if (!isRouteWorkbook) {
    const evidenceInputs: EvidenceInput[] = [];
    for (const entry of payload.rows) {
      const row = entry.data as Record<string, unknown>;
      const markedDates = dateColumns.filter(({ column }) => isVisitMarked(row[column]));
      for (const { date } of markedDates) {
        evidenceInputs.push({
          importId: artifact.importId,
          operationId: operation.id,
          evidenceDate: date as Date,
          storeName: text(row.LOJA ?? row.NOME_LOJA ?? row.STORE),
          // KING identifies the client industry by workbook layout; BANDEIRA is
          // retained in rawIndustryName but must not be treated as the industry.
          industryName: payload.detectedType === SpreadsheetType.KING_CHECKLIST ? 'KING' : text(row.INDUSTRIA),
          sourceFile: fileName,
          sourceSheet: text(payload.sheets[0]) || undefined,
          sourceRow: entry.sourceRow ?? undefined,
          state: text(row.UF) || undefined,
          city: text(row.CIDADE) || undefined,
          brand: text(row.BANDEIRA ?? row.INDUSTRIA) || undefined,
          operationStartsAt: operation.startsAt,
          operationEndsAt: operation.endsAt,
        });
      }
    }
    const reconciliation = await new VisitReconciliationService(new VisitMatchRepository(tx)).reconcileMany(evidenceInputs);
    reconciliationMatched = reconciliation.matched;
    developmentLog('reconciliation', { ...reconciliation });
  }

  await tx.importFile.upsert({
    where: { fileHash: artifact.fileHash },
    create: { importId: artifact.importId, fileName, fileHash: artifact.fileHash, rowCount: Number(payload.audit.totalRows ?? payload.rows.length) },
    update: { importId: artifact.importId, fileName, rowCount: Number(payload.audit.totalRows ?? payload.rows.length) },
  });
  await tx.import.update({ where: { id: artifact.importId }, data: { status: 'SUCCESS' } });

  return {
    createdStores: result.createdStores,
    updatedStores: result.updatedStores,
    createdIndustries: result.createdIndustries,
    updatedIndustries: result.updatedIndustries,
    createdPromoters: result.createdPromoters,
    updatedPromoters: result.updatedPromoters,
    createdVisits: result.createdVisits,
    updatedVisits: result.updatedVisits + reconciliationMatched,
    ignoredDuplicates: candidate.statistics.duplicatedVisits + Number(payload.audit.duplicateRows ?? 0),
    ignoredInvalidRows: artifact.rejectedRows,
  };
}
