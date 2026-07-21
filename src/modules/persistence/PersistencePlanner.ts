import { prisma as defaultPrisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { OperationCandidate } from '../mapping/operation/OperationCandidate';
import type { PersistencePlan } from './PersistencePlan';
import type { StoreCandidate } from '../mapping/store/StoreCandidate';
import type { IndustryCandidate } from '../mapping/industry/IndustryCandidate';
import type { PromoterCandidate } from '../mapping/promoter/PromoterCandidate';
import type { VisitCandidate } from '../mapping/visit/VisitCandidate';

interface StoreQueryResult {
  code: string;
}

interface IndustryQueryResult {
  code: string;
}

interface PromoterQueryResult {
  name: string;
}

interface VisitQueryResult {
  scheduledDate: Date;
  store: { code: string } | null;
  industry: { code: string } | null;
  promoter: { name: string } | null;
}

export class PersistencePlanner {
  static async plan(
    candidate: OperationCandidate,
    operationId: string,
    prisma: PrismaClient = defaultPrisma as unknown as PrismaClient
  ): Promise<PersistencePlan> {
    const storeCodes = candidate.stores.map((s) => s.code);
    const industryCodes = candidate.industries.map((i) => i.code);
    const promoterNames = candidate.promoters.map((p) => p.name);

    // 1. Consultar banco somente para comparação (apenas leitura)
    const [existingStores, existingIndustries, existingPromoters, existingVisits] = await Promise.all([
      storeCodes.length > 0
        ? (prisma.store.findMany({
            where: { code: { in: storeCodes } },
            select: { code: true },
          }) as unknown as Promise<StoreQueryResult[]>)
        : Promise.resolve([] as StoreQueryResult[]),
      industryCodes.length > 0
        ? (prisma.industry.findMany({
            where: { code: { in: industryCodes } },
            select: { code: true },
          }) as unknown as Promise<IndustryQueryResult[]>)
        : Promise.resolve([] as IndustryQueryResult[]),
      promoterNames.length > 0
        ? (prisma.promoter.findMany({
            where: { name: { in: promoterNames } },
            select: { name: true },
          }) as unknown as Promise<PromoterQueryResult[]>)
        : Promise.resolve([] as PromoterQueryResult[]),
      prisma.visit.findMany({
        where: { operationId },
        include: { store: true, industry: true, promoter: true },
      }) as unknown as Promise<VisitQueryResult[]>,
    ]);

    const existingStoreCodes = new Set(existingStores.map((s) => s.code));
    const existingIndustryCodes = new Set(existingIndustries.map((i) => i.code));
    const existingPromoterNames = new Set(existingPromoters.map((p) => p.name.toUpperCase()));

    // 2. Identificar CREATE ou UPDATE para Lojas, Indústrias e Promotores
    const storesToCreate = candidate.stores.filter((s) => !existingStoreCodes.has(s.code));
    const storesToUpdate = candidate.stores.filter((s) => existingStoreCodes.has(s.code));

    const industriesToCreate = candidate.industries.filter((i) => !existingIndustryCodes.has(i.code));
    const industriesToUpdate = candidate.industries.filter((i) => existingIndustryCodes.has(i.code));

    const promotersToCreate = candidate.promoters.filter((p) => !existingPromoterNames.has(p.name.toUpperCase()));
    const promotersToUpdate = candidate.promoters.filter((p) => existingPromoterNames.has(p.name.toUpperCase()));

    // 3. Mapeamento e comparação de Visitas
    const visitsToCreate: VisitCandidate[] = [];
    const visitsToUpdate: VisitCandidate[] = [];

    for (const candidateVisit of candidate.visits) {
      const storeCode = candidateVisit.store.code;
      const industryCode = candidateVisit.industry.code;
      const promoterName = candidateVisit.promoter?.name?.toUpperCase() || 'NO_PROMOTER';
      const targetDate = candidateVisit.scheduledDate;
      const matchingVisits = existingVisits.filter((visit) => {
        const existingPromoter = visit.promoter?.name?.toUpperCase() || 'NO_PROMOTER';
        const normalizedPromoter = existingPromoter === 'PROMOTOR PADRÃO' ? 'NO_PROMOTER' : existingPromoter;
        return visit.store?.code === storeCode
          && visit.industry?.code === industryCode
          && normalizedPromoter === promoterName;
      });
      const matchingVisit = targetDate
        ? matchingVisits.find((visit) => visit.scheduledDate.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10))
        : matchingVisits[candidateVisit.plannedVisitIndex - 1];

      if (matchingVisit) {
        visitsToUpdate.push(candidateVisit);
      } else {
        visitsToCreate.push(candidateVisit);
      }
    }

    return {
      storesToCreate,
      storesToUpdate,
      industriesToCreate,
      industriesToUpdate,
      promotersToCreate,
      promotersToUpdate,
      visitsToCreate,
      visitsToUpdate,
    };
  }
}
