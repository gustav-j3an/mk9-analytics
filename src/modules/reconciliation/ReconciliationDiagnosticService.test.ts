import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyDateDifference } from './ReconciliationDiagnosticService';

test('classifica divergencia de um dia na mesma semana', () => {
  const result = classifyDateDifference(new Date('2026-06-08T12:00:00Z'), new Date('2026-06-09T12:00:00Z'));
  assert.equal(result.distanceBucket, 'ONE_DAY');
  assert.equal(result.sameWeek, true);
});

test('classifica divergencia de sete dias em outra semana', () => {
  const result = classifyDateDifference(new Date('2026-06-01T12:00:00Z'), new Date('2026-06-08T12:00:00Z'));
  assert.equal(result.distanceBucket, 'SEVEN_DAYS');
  assert.equal(result.sameWeek, false);
});
