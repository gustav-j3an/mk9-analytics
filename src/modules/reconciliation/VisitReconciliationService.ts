import { createHash } from 'node:crypto';
import type { EvidenceInput, ReconciliationDecision, ReconciliationSummary, ResolvedEntity } from './ReconciliationTypes';

export interface ReconciliationRepository {
  resolveStore(name: string, state?: string, city?: string): Promise<ResolvedEntity | null>;
  resolveIndustry(name: string): Promise<ResolvedEntity | null>;
  findExact(input: EvidenceInput, storeId: string, industryId: string): Promise<Array<{ id: string; promoterId: string; scheduledDate: Date }>>;
  findNearby(input: EvidenceInput, storeId: string, industryId: string): Promise<Array<{ id: string; promoterId: string; scheduledDate: Date }>>;
  exists(key: string): Promise<boolean>;
  save(input: EvidenceInput, decision: ReconciliationDecision, key: string): Promise<unknown>;
}

export function evidenceKey(input: EvidenceInput) {
  if (input.existingEvidenceKey) return input.existingEvidenceKey;
  return createHash('sha256').update([
    input.operationId,
    input.evidenceDate.toISOString().slice(0, 10),
    input.storeName,
    input.industryName,
    input.sourceSheet ?? '',
    String(input.sourceRow ?? ''),
  ].join('|')).digest('hex');
}

function utcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function dateDistanceDays(left: Date, right: Date) {
  return Math.round(Math.abs(utcDay(left) - utcDay(right)) / 86_400_000);
}

export function isSameIsoWeek(left: Date, right: Date) {
  const monday = (date: Date) => {
    const value = new Date(utcDay(date));
    value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
    return value.getTime();
  };
  return monday(left) === monday(right);
}

export class VisitReconciliationService {
  constructor(private readonly repository: ReconciliationRepository) {}

  async reconcile(input: EvidenceInput, options: { reprocess?: boolean } = {}): Promise<ReconciliationDecision> {
    const key = evidenceKey(input);
    if (!options.reprocess && await this.repository.exists(key)) {
      return { result: 'DUPLICATE_EVIDENCE', confidence: 100 };
    }
    const store = await this.repository.resolveStore(input.storeName, input.state, input.city);
    if (!store || !store.id || store.ambiguous) {
      const decision: ReconciliationDecision = { result: store?.ambiguous ? 'AMBIGUOUS' : 'STORE_NOT_FOUND', confidence: 0, diagnostics: store?.diagnostics };
      await this.repository.save(input, decision, key);
      return decision;
    }
    const industry = await this.repository.resolveIndustry(input.industryName);
    if (!industry || industry.ambiguous) {
      const decision: ReconciliationDecision = { result: industry?.ambiguous ? 'AMBIGUOUS' : 'INDUSTRY_NOT_FOUND', storeId: store.id, confidence: 0 };
      await this.repository.save(input, decision, key);
      return decision;
    }
    const exact = await this.repository.findExact(input, store.id, industry.id);
    let decision: ReconciliationDecision;
    if (exact.length === 1) {
      decision = { result: 'MATCHED', visitId: exact[0].id, promoterId: exact[0].promoterId, storeId: store.id, industryId: industry.id, confidence: Math.min(store.confidence, industry.confidence) };
    } else if (exact.length > 1) {
      decision = { result: 'AMBIGUOUS', storeId: store.id, industryId: industry.id, confidence: 0 };
    } else {
      const nearby = await this.repository.findNearby(input, store.id, industry.id);
      const closest = nearby.sort((left, right) => dateDistanceDays(input.evidenceDate, left.scheduledDate) - dateDistanceDays(input.evidenceDate, right.scheduledDate))[0];
      decision = { result: closest ? 'DATE_MISMATCH' : 'UNPLANNED', storeId: store.id, industryId: industry.id, confidence: Math.min(store.confidence, industry.confidence) };
      if (closest) {
        const distanceDays = dateDistanceDays(input.evidenceDate, closest.scheduledDate);
        decision.suggestion = {
          visitId: closest.id,
          plannedDate: closest.scheduledDate.toISOString(),
          evidenceDate: input.evidenceDate.toISOString(),
          distanceDays,
          promoterId: closest.promoterId,
          confidence: Math.max(0, 100 - distanceDays * 10),
          sameWeek: isSameIsoWeek(input.evidenceDate, closest.scheduledDate),
          outsideOperation: Boolean(
            input.operationStartsAt && input.evidenceDate < input.operationStartsAt
            || input.operationEndsAt && input.evidenceDate > input.operationEndsAt,
          ),
        };
      }
    }
    await this.repository.save(input, decision, key);
    return decision;
  }

  async reconcileMany(inputs: EvidenceInput[]): Promise<ReconciliationSummary> {
    const decisions = [];
    for (const input of inputs) decisions.push(await this.reconcile(input));
    return {
      total: decisions.length,
      matched: decisions.filter((item) => item.result === 'MATCHED').length,
      unplanned: decisions.filter((item) => item.result === 'UNPLANNED').length,
      ambiguous: decisions.filter((item) => item.result === 'AMBIGUOUS').length,
      dateMismatch: decisions.filter((item) => item.result === 'DATE_MISMATCH').length,
      storeNotFound: decisions.filter((item) => item.result === 'STORE_NOT_FOUND').length,
      industryNotFound: decisions.filter((item) => item.result === 'INDUSTRY_NOT_FOUND').length,
      duplicateEvidence: decisions.filter((item) => item.result === 'DUPLICATE_EVIDENCE').length,
      promotersIdentified: new Set(decisions.map((item) => item.promoterId).filter(Boolean)).size,
    };
  }
}
