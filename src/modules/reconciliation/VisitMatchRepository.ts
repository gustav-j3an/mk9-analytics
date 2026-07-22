import { Prisma } from '@prisma/client';
import { canonicalize } from '@/modules/shared/normalization';
import type { EvidenceInput, PlannedVisit, ReconciliationDecision } from './ReconciliationTypes';
import { StoreAliasResolver } from './StoreAliasResolver';
import { storeKey, storeSimilarity } from './store-similarity';

function dayBounds(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export class VisitMatchRepository {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async resolveStore(name: string, state?: string, city?: string) {
    const stores = await this.tx.store.findMany({
      select: { id: true, code: true, name: true, state: true, city: true, aliases: { select: { alias: true } } },
    });
    const candidates = stores.map((store) => ({ ...store, aliases: store.aliases.map((alias) => alias.alias) }));
    const resolved = StoreAliasResolver.resolve(name, candidates, state, city);
    if (resolved?.id && resolved.confidence < 100) {
      await this.tx.storeAlias.upsert({
        where: { aliasKey: storeKey(name) },
        create: { aliasKey: storeKey(name), alias: name, storeId: resolved.id },
        update: { alias: name, storeId: resolved.id },
      });
    }
    const ranked = candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      state: candidate.state,
      score: Math.round(storeSimilarity(name, candidate.name) * 100),
      rejectedBecause: candidate.state && state && canonicalize(candidate.state) !== canonicalize(state)
        ? 'UF incompatível'
        : 'confiança insuficiente ou candidato concorrente',
    })).filter((candidate) => candidate.score > 0).sort((left, right) => right.score - left.score).slice(0, 5);
    return resolved ? { ...resolved, diagnostics: { candidates: ranked } } : { id: '', confidence: 0, diagnostics: { candidates: ranked } };
  }

  async resolveIndustry(name: string) {
    const key = canonicalize(name);
    const aliases = await this.tx.industryAlias.findMany({ where: { aliasKey: key }, select: { industryId: true } });
    const industries = await this.tx.industry.findMany({
      where: { OR: [{ code: key }, { id: { in: aliases.map((item) => item.industryId) } }] },
      select: { id: true, code: true },
    });
    return industries.length === 1 ? { id: industries[0].id, confidence: industries[0].code === key ? 100 : 95 } : industries.length > 1 ? { id: '', confidence: 0, ambiguous: true } : null;
  }

  async findExact(input: EvidenceInput, storeId: string, industryId: string): Promise<PlannedVisit[]> {
    const { start, end } = dayBounds(input.evidenceDate);
    return this.tx.visit.findMany({
      where: { operationId: input.operationId, storeId, industryId, scheduledDate: { gte: start, lt: end } },
      select: { id: true, promoterId: true, scheduledDate: true },
    });
  }

  async findNearby(input: EvidenceInput, storeId: string, industryId: string): Promise<PlannedVisit[]> {
    return this.tx.visit.findMany({
      where: { operationId: input.operationId, storeId, industryId },
      select: { id: true, promoterId: true, scheduledDate: true },
    });
  }

  async exists(deduplicationKey: string) {
    return Boolean(await this.tx.visitEvidence.findUnique({ where: { deduplicationKey }, select: { id: true } }));
  }

  async save(input: EvidenceInput, decision: ReconciliationDecision, deduplicationKey: string) {
    const data = {
        importId: input.importId,
        operationId: input.operationId,
        visitId: decision.visitId,
        storeId: decision.storeId,
        industryId: decision.industryId,
        evidenceDate: input.evidenceDate,
        sourceFile: input.sourceFile,
        sourceSheet: input.sourceSheet,
        sourceRow: input.sourceRow,
        rawStoreName: input.storeName,
        rawIndustryName: input.industryName,
        rawBrand: input.brand,
        rawCity: input.city,
        rawState: input.state,
        suggestion: decision.suggestion ?? Prisma.JsonNull,
        diagnostics: decision.diagnostics
          ? decision.diagnostics as Prisma.InputJsonValue
          : Prisma.JsonNull,
        deduplicationKey,
        result: decision.result,
        confidence: decision.confidence,
    };
    const evidence = await this.tx.visitEvidence.upsert({
      where: { deduplicationKey },
      create: data,
      update: {
        visitId: decision.visitId ?? null,
        storeId: decision.storeId ?? null,
        industryId: decision.industryId ?? null,
        result: decision.result,
        confidence: decision.confidence,
        suggestion: decision.suggestion ?? Prisma.JsonNull,
        diagnostics: decision.diagnostics
          ? decision.diagnostics as Prisma.InputJsonValue
          : Prisma.JsonNull,
      },
    });
    if (decision.result === 'MATCHED' && decision.visitId) {
      await this.tx.visit.update({
        where: { id: decision.visitId },
        data: { status: 'REALIZADA', completedDate: input.evidenceDate },
      });
    }
    return evidence;
  }
}
