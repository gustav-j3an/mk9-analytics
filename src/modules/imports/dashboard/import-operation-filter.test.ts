import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImportOperationFilter } from './ImportsDashboardRepository';

test('filtro por operação usa somente operationId explícito', () => {
  assert.deepEqual(buildImportOperationFilter('operation-1'), { operationId: 'operation-1' });
});

test('dashboard sem filtro preserva importações antigas com operationId nulo', () => {
  assert.equal(buildImportOperationFilter(undefined), undefined);
});
