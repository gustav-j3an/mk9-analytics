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
  const dateColumns = payload.columns.map((column) => ({ column, date: dateFromColumn(column) })).filter((item) => item.date !== null);
  if (dateColumns.length === 0) throw new Error('O preview não contém colunas de datas persistíveis.');

  const firstDate = dateColumns[0].date as Date;
  const year = firstDate.getUTCFullYear();
  const month = firstDate.getUTCMonth() + 1;
  const startsAt = new Date(Date.UTC(year, month - 1, 1, 12));
  const endsAt = new Date(Date.UTC(year, month, 0, 12));
  const fileName = text(payload.file.name) || `Importação ${month}/${year}`;
  const operation = await tx.operation.upsert({
    where: { month_year: { month, year } },
    create: { name: fileName.replace(/\.[^.]+$/, ''), month, year, startsAt, endsAt, status: 'IN_PROGRESS' },
    update: { name: fileName.replace(/\.[^.]+$/, ''), startsAt, endsAt, status: 'IN_PROGRESS' },
  });

  const stores = [];
  const industries = [];
  const promoters = [];
  const visits: VisitCandidate[] = [];

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

    const markedDates = dateColumns.filter(({ column }) => row[column] === '✓');
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

  const candidate = OperationMapper.map(stores, industries, promoters, visits);
  const plan = await PersistencePlanner.plan(candidate, operation.id, tx as never);
  const result = await PersistenceEngine.persist(plan, operation.id, tx as never);

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
    updatedVisits: result.updatedVisits,
    ignoredDuplicates: candidate.statistics.duplicatedVisits + Number(payload.audit.duplicateRows ?? 0),
    ignoredInvalidRows: artifact.rejectedRows,
  };
}
