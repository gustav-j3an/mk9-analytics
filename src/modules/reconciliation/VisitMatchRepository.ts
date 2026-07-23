import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { canonicalize } from '@/modules/shared/normalization';
import type { EvidenceInput, PlannedVisit, ReconciliationDecision } from './ReconciliationTypes';
import { StoreAliasResolver } from './StoreAliasResolver';
import { storeKey, storeSimilarity } from './store-similarity';

const WRITE_BATCH_SIZE = 200;

function batches<T>(items: T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += WRITE_BATCH_SIZE) {
    result.push(items.slice(index, index + WRITE_BATCH_SIZE));
  }
  return result;
}

function dayBounds(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export class VisitMatchRepository {
  private prepared = false;
  private preparedStores: Array<{ id: string; code: string; name: string; state: string | null; city: string | null; aliases: string[] }> = [];
  private preparedIndustries: Array<{ id: string; code: string }> = [];
  private preparedIndustryAliases = new Map<string, string[]>();
  private preparedVisits: Array<{ id: string; operationId: string; storeId: string; industryId: string; promoterId: string; scheduledDate: Date }> = [];
  private evidenceKeys = new Set<string>();
  private pendingEvidence: Prisma.VisitEvidenceCreateManyInput[] = [];
  private pendingStoreAliases = new Map<string, { aliasKey: string; alias: string; storeId: string }>();
  private pendingVisitUpdates = new Map<string, { ids: Set<string>; completedDate: Date }>();

  constructor(private readonly tx: Prisma.TransactionClient) {}

  async prepare(inputs: EvidenceInput[]) {
    const evidenceKeys = inputs.map((input) => {
      if (input.existingEvidenceKey) return input.existingEvidenceKey;
      return createHash('sha256').update([
        input.operationId,
        input.evidenceDate.toISOString().slice(0, 10),
        input.storeName,
        input.industryName,
        input.sourceSheet ?? '',
        String(input.sourceRow ?? ''),
      ].join('|')).digest('hex');
    });
    const industryKeys = [...new Set(inputs.map((input) => canonicalize(input.industryName)))];
    const operationIds = [...new Set(inputs.map((input) => input.operationId))];
    const [stores, aliases, industries, visits, existingEvidence] = await Promise.all([
      this.tx.store.findMany({
        select: { id: true, code: true, name: true, state: true, city: true, aliases: { select: { alias: true } } },
      }),
      this.tx.industryAlias.findMany({
        where: { aliasKey: { in: industryKeys } },
        select: { aliasKey: true, industryId: true },
      }),
      this.tx.industry.findMany({ select: { id: true, code: true } }),
      this.tx.visit.findMany({
        where: { operationId: { in: operationIds } },
        select: { id: true, operationId: true, storeId: true, industryId: true, promoterId: true, scheduledDate: true },
      }),
      this.tx.visitEvidence.findMany({
        where: { deduplicationKey: { in: evidenceKeys } },
        select: { deduplicationKey: true },
      }),
    ]);
    this.preparedStores = stores.map((store) => ({ ...store, aliases: store.aliases.map((alias) => alias.alias) }));
    this.preparedIndustries = industries;
    this.preparedVisits = visits;
    this.evidenceKeys = new Set(existingEvidence.map((evidence) => evidence.deduplicationKey));
    for (const alias of aliases) {
      const ids = this.preparedIndustryAliases.get(alias.aliasKey) ?? [];
      ids.push(alias.industryId);
      this.preparedIndustryAliases.set(alias.aliasKey, ids);
    }
    this.prepared = true;
  }

  async resolveStore(name: string, state?: string, city?: string) {
    const candidates = this.prepared
      ? this.preparedStores
      : (await this.tx.store.findMany({
          select: { id: true, code: true, name: true, state: true, city: true, aliases: { select: { alias: true } } },
        })).map((store) => ({ ...store, aliases: store.aliases.map((alias) => alias.alias) }));
    const resolved = StoreAliasResolver.resolve(name, candidates, state, city);
    if (resolved?.id && resolved.confidence < 100) {
      const aliasKey = storeKey(name);
      if (this.prepared) {
        this.pendingStoreAliases.set(aliasKey, { aliasKey, alias: name, storeId: resolved.id });
      } else {
        await this.tx.storeAlias.upsert({
          where: { aliasKey },
          create: { aliasKey, alias: name, storeId: resolved.id },
          update: { alias: name, storeId: resolved.id },
        });
      }
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
    const industries = this.prepared
      ? this.preparedIndustries.filter((industry) =>
          industry.code === key || (this.preparedIndustryAliases.get(key) ?? []).includes(industry.id))
      : await this.tx.industry.findMany({
          where: {
            OR: [
              { code: key },
              {
                id: {
                  in: (await this.tx.industryAlias.findMany({
                    where: { aliasKey: key },
                    select: { industryId: true },
                  })).map((item) => item.industryId),
                },
              },
            ],
          },
          select: { id: true, code: true },
        });
    return industries.length === 1 ? { id: industries[0].id, confidence: industries[0].code === key ? 100 : 95 } : industries.length > 1 ? { id: '', confidence: 0, ambiguous: true } : null;
  }

  async findExact(input: EvidenceInput, storeId: string, industryId: string): Promise<PlannedVisit[]> {
    const { start, end } = dayBounds(input.evidenceDate);
    if (this.prepared) {
      return this.preparedVisits.filter((visit) =>
        visit.operationId === input.operationId
        && visit.storeId === storeId
        && visit.industryId === industryId
        && visit.scheduledDate >= start
        && visit.scheduledDate < end);
    }
    return this.tx.visit.findMany({
      where: { operationId: input.operationId, storeId, industryId, scheduledDate: { gte: start, lt: end } },
      select: { id: true, promoterId: true, scheduledDate: true },
    });
  }

  async findNearby(input: EvidenceInput, storeId: string, industryId: string): Promise<PlannedVisit[]> {
    if (this.prepared) {
      return this.preparedVisits.filter((visit) =>
        visit.operationId === input.operationId
        && visit.storeId === storeId
        && visit.industryId === industryId);
    }
    return this.tx.visit.findMany({
      where: { operationId: input.operationId, storeId, industryId },
      select: { id: true, promoterId: true, scheduledDate: true },
    });
  }

  async exists(deduplicationKey: string) {
    if (this.prepared) return this.evidenceKeys.has(deduplicationKey);
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
    if (this.prepared) {
      this.pendingEvidence.push(data);
      this.evidenceKeys.add(deduplicationKey);
      if (decision.result === 'MATCHED' && decision.visitId) {
        const groupKey = input.evidenceDate.toISOString();
        const group = this.pendingVisitUpdates.get(groupKey)
          ?? { ids: new Set<string>(), completedDate: input.evidenceDate };
        group.ids.add(decision.visitId);
        this.pendingVisitUpdates.set(groupKey, group);
      }
      return data;
    }
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

  async flush() {
    for (const batch of batches([...this.pendingStoreAliases.values()])) {
      await this.tx.storeAlias.createMany({ data: batch, skipDuplicates: true });
    }
    for (const batch of batches(this.pendingEvidence)) {
      await this.tx.visitEvidence.createMany({ data: batch, skipDuplicates: true });
    }
    for (const group of this.pendingVisitUpdates.values()) {
      await this.tx.visit.updateMany({
        where: { id: { in: [...group.ids] } },
        data: { status: 'REALIZADA', completedDate: group.completedDate },
      });
    }
  }
}
