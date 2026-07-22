import assert from 'node:assert/strict';
import test from 'node:test';
import { dateDistanceDays, isSameIsoWeek, VisitReconciliationService, type ReconciliationRepository } from './VisitReconciliationService';
import type { EvidenceInput, ReconciliationDecision } from './ReconciliationTypes';

function input(overrides: Partial<EvidenceInput> = {}): EvidenceInput {
  return { importId: 'i1', operationId: 'o1', evidenceDate: new Date('2026-06-08T12:00:00Z'), storeName: 'ASSAI - HUNTERS', industryName: 'KING', sourceFile: 'king.xlsx', ...overrides };
}

function repository(exact = 1, nearby = 0): ReconciliationRepository {
  const keys = new Set<string>();
  return {
    resolveStore: async () => ({ id: 's1', confidence: 95 }),
    resolveIndustry: async () => ({ id: 'in1', confidence: 100 }),
    findExact: async () => Array.from({ length: exact }, (_, index) => ({ id: 'v' + index, promoterId: 'p' + index, scheduledDate: input().evidenceDate })),
    findNearby: async () => Array.from({ length: nearby }, (_, index) => ({ id: 'n' + index, promoterId: 'p' + index, scheduledDate: new Date('2026-06-09T12:00:00Z') })),
    exists: async (key) => keys.has(key),
    save: async (_e, _d, key) => { keys.add(key); },
  };
}

test('correspondencia exata preserva o promotor planejado', async () => {
  const result = await new VisitReconciliationService(repository()).reconcile(input());
  assert.deepEqual(result, { result: 'MATCHED', visitId: 'v0', promoterId: 'p0', storeId: 's1', industryId: 'in1', confidence: 95 });
});

test('duas visitas candidatas sao ambiguas', async () => {
  assert.equal((await new VisitReconciliationService(repository(2)).reconcile(input())).result, 'AMBIGUOUS');
});

test('visita em outra data gera DATE_MISMATCH', async () => {
  assert.equal((await new VisitReconciliationService(repository(0, 1)).reconcile(input())).result, 'DATE_MISMATCH');
});

test('visita sem roteiro gera UNPLANNED', async () => {
  assert.equal((await new VisitReconciliationService(repository(0)).reconcile(input())).result, 'UNPLANNED');
});

test('checklist repetido e idempotente', async () => {
  const service = new VisitReconciliationService(repository());
  assert.equal((await service.reconcile(input())).result, 'MATCHED');
  assert.equal((await service.reconcile(input())).result, 'DUPLICATE_EVIDENCE');
});

test('classifica divergencia de um dia e sugere sem associar', async () => {
  const result = await new VisitReconciliationService(repository(0, 1)).reconcile(input());
  assert.equal(result.result, 'DATE_MISMATCH');
  assert.equal(result.visitId, undefined);
  assert.equal(result.suggestion?.distanceDays, 1);
});

test('calcula sete dias sem erro de timezone', () => {
  assert.equal(dateDistanceDays(new Date('2026-06-01T23:00:00-03:00'), new Date('2026-06-09T02:00:00Z')), 7);
  assert.equal(isSameIsoWeek(new Date('2026-06-01T12:00:00Z'), new Date('2026-06-08T12:00:00Z')), false);
});

test('reprocessamento ignora somente a barreira de duplicidade', async () => {
  const repo = repository();
  const service = new VisitReconciliationService(repo);
  await service.reconcile(input());
  const result = await service.reconcile(input(), { reprocess: true });
  assert.equal(result.result, 'MATCHED');
  assert.equal(result.promoterId, 'p0');
});
