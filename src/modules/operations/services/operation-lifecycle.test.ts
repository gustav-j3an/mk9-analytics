import assert from 'node:assert/strict';
import test from 'node:test';
import { OperationStatus } from '@prisma/client';
import { buildOperationDuplicateData, canConfirmOperationDeletion, hasLinkedOperationData, operationImpact } from './OperationLifecycleService';

const emptyImpact = { stores: 0, promoters: 0, industries: 0, visits: 0, imports: 0, reconciliations: 0, evidences: 0, routes: 0 };

test('operação vazia pode ser excluída fisicamente', () => {
  assert.equal(hasLinkedOperationData(emptyImpact), false);
});

test('bloqueia exclusão quando existe qualquer dado vinculado', () => {
  for (const key of ['promoters', 'visits', 'imports', 'reconciliations', 'evidences', 'routes'] as const) {
    assert.equal(hasLinkedOperationData({ ...emptyImpact, [key]: 1 }), true, key);
  }
});

test('calcula impacto sem duplicar lojas, promotores ou indústrias', () => {
  assert.deepEqual(operationImpact({
    visits: [
      { storeId: 's1', promoterId: 'p1', industryId: 'i1' },
      { storeId: 's1', promoterId: 'p1', industryId: 'i2' },
    ],
    promoters: [{ id: 'p1' }, { id: 'p2' }],
    imports: [{ id: 'm1' }],
    evidences: [{ id: 'e1', result: 'MATCHED' }, { id: 'e2', result: 'UNPLANNED' }],
  }), { stores: 1, promoters: 2, industries: 2, visits: 2, imports: 1, reconciliations: 1, evidences: 2, routes: 2 });
});

test('modal só habilita exclusão com frase exata e operação vazia', () => {
  assert.equal(canConfirmOperationDeletion(true, 'EXCLUIR OPERAÇÃO'), true);
  assert.equal(canConfirmOperationDeletion(true, 'excluir operação'), false);
  assert.equal(canConfirmOperationDeletion(false, 'EXCLUIR OPERAÇÃO'), false);
});

test('duplicação copia configuração e não inclui dados operacionais', () => {
  const result = buildOperationDuplicateData({ name: 'Julho', clientId: 'Cliente', description: 'Descrição', observations: 'Checklist padrão' }, 8, 2026);
  assert.equal(result.name, 'Julho — cópia');
  assert.equal(result.status, OperationStatus.PLANNING);
  assert.equal(result.clientId, 'Cliente');
  assert.equal(result.observations, 'Checklist padrão');
  assert.equal('visits' in result, false);
  assert.equal('imports' in result, false);
});
