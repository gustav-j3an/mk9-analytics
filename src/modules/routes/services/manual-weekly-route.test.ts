import assert from 'node:assert/strict';
import test from 'node:test';
import { copyPlannedWeek, groupRouteVisits, validateWeeklyRouteDraft, type ManualVisitInput } from './ManualWeeklyRouteService';

const base: ManualVisitInput = {
  operationId: 'op-1', promoterId: 'p-1', storeId: 's-1', industryIds: ['i-1'],
  scheduledDate: '2026-07-20T12:00:00.000Z', routeOrder: 1, weeklyFrequency: 1,
  status: 'PLANEJADA',
};

test('aceita várias indústrias agrupadas na mesma loja e dia', () => {
  assert.deepEqual(validateWeeklyRouteDraft([{ ...base, industryIds: ['i-1', 'i-2', 'i-3'] }]), []);
});

test('impede duplicidade exata de indústria, loja, promotor e dia', () => {
  const conflicts = validateWeeklyRouteDraft([base, { ...base, routeOrder: 2 }]);
  assert.equal(conflicts.some((item) => item.code === 'DUPLICATE_VISIT'), true);
});

test('alerta indústria repetida em outra loja no mesmo dia', () => {
  const conflicts = validateWeeklyRouteDraft([base, { ...base, storeId: 's-2', routeOrder: 2 }]);
  assert.equal(conflicts.some((item) => item.code === 'MULTIPLE_STORES_INDUSTRIES'), true);
});

test('detecta conflito de ordem', () => {
  const conflicts = validateWeeklyRouteDraft([base, { ...base, storeId: 's-2', industryIds: ['i-2'] }]);
  assert.equal(conflicts.some((item) => item.code === 'ORDER_CONFLICT'), true);
});

test('mover visita para outro dia elimina conflito de duplicidade', () => {
  assert.equal(validateWeeklyRouteDraft([base, { ...base, scheduledDate: '2026-07-23T12:00:00.000Z', routeOrder: 1 }]).length, 0);
});

test('agrupa registros de múltiplas indústrias por promotor, dia e loja', () => {
  const groups = groupRouteVisits([
    { promoterId: 'p-1', storeId: 's-1', scheduledDate: base.scheduledDate, industryId: 'i-1' },
    { promoterId: 'p-1', storeId: 's-1', scheduledDate: base.scheduledDate, industryId: 'i-2' },
  ]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].industryIds, ['i-1', 'i-2']);
});

test('cópia semanal preserva somente planejamento', () => {
  const result = copyPlannedWeek([base, { ...base, status: 'REALIZADA' }], 7);
  assert.equal(result.length, 1);
  assert.equal(result[0].scheduledDate.slice(0, 10), '2026-07-27');
});
