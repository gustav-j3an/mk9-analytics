import test from 'node:test';
import assert from 'node:assert/strict';
import { OperationStatus } from '@prisma/client';
import { validateDateRange, validateMonthYearDates, validateOperationData, validateOperationUpdateData } from '../validators/operation.validator';

test('aceita os dados minimos para criar uma operacao planejada', () => {
  const startsAt = new Date('2026-08-01T12:00:00.000Z');
  const result = validateOperationData({ name: 'Operacao Agosto', month: 8, year: 2026, startsAt, endsAt: new Date('2026-08-31T12:00:00.000Z'), status: OperationStatus.PLANNING });
  assert.equal(result.name, 'Operacao Agosto');
  assert.equal(result.status, OperationStatus.PLANNING);
});

test('aceita edicao parcial e os status de arquivamento e reativacao', () => {
  assert.equal(validateOperationUpdateData({ status: OperationStatus.ARCHIVED }).status, OperationStatus.ARCHIVED);
  assert.equal(validateOperationUpdateData({ status: OperationStatus.OPEN }).status, OperationStatus.OPEN);
});

test('rejeita intervalo em que o termino antecede o inicio', () => {
  assert.equal(validateDateRange(new Date('2026-08-20'), new Date('2026-08-10')), false);
});

test('valida que inicio e termino pertencem ao mes da operacao', () => {
  assert.equal(validateMonthYearDates(8, 2026, new Date('2026-08-01T12:00:00Z'), new Date('2026-08-31T12:00:00Z')), true);
  assert.equal(validateMonthYearDates(8, 2026, new Date('2026-08-01T12:00:00Z'), new Date('2026-09-01T12:00:00Z')), false);
});
