import { prisma } from '@/lib/prisma';
import type { ReconciliationResult } from '@prisma/client';

export interface ReconciliationFilters {
  operationId?: string;
  promoterId?: string;
  industryId?: string;
  storeId?: string;
  state?: string;
  result?: ReconciliationResult;
  from?: Date;
  to?: Date;
}

export class ReconciliationDashboardRepository {
  static async getData(filters: ReconciliationFilters) {
    const where = {
      operationId: filters.operationId || undefined,
      industryId: filters.industryId || undefined,
      storeId: filters.storeId || undefined,
      result: filters.result || undefined,
      evidenceDate: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined,
      store: filters.state ? { state: filters.state } : undefined,
      visit: filters.promoterId ? { promoterId: filters.promoterId } : undefined,
    };
    const [evidences, planned, operations, promoters, industries, stores] = await Promise.all([
      prisma.visitEvidence.findMany({
        where,
        orderBy: [{ evidenceDate: 'desc' }, { createdAt: 'desc' }],
        include: { visit: { include: { promoter: true } }, store: true, industry: true, operation: true },
        take: 500,
      }),
      prisma.visit.count({ where: { operationId: filters.operationId || undefined } }),
      prisma.operation.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, name: true } }),
      prisma.promoter.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.industry.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.store.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, state: true } }),
    ]);
    const count = (result: ReconciliationResult) => evidences.filter((item) => item.result === result).length;
    return {
      evidences,
      metrics: {
        planned,
        evidence: evidences.length,
        matched: count('MATCHED'),
        unplanned: count('UNPLANNED'),
        dateMismatch: count('DATE_MISMATCH'),
        ambiguous: count('AMBIGUOUS'),
        storesNotFound: count('STORE_NOT_FOUND'),
        pending: evidences.filter((item) => item.result !== 'MATCHED' && !item.reviewedAt).length,
      },
      options: { operations, promoters, industries, stores },
    };
  }
}
