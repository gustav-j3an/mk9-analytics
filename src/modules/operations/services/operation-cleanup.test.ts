import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCleanupPreview, selectedCleanupCount, type OperationCleanupSelection } from './OperationCleanupService';

const record = {
  id: 'op-1',
  name: 'Operação',
  visits: [
    { id: 'v1', status: 'PLANEJADA' as const, storeId: 's1', promoterId: 'p1', industryId: 'i1' },
    { id: 'v2', status: 'REALIZADA' as const, storeId: 's1', promoterId: 'p1', industryId: 'i1' },
    { id: 'v3', status: 'CANCELADA' as const, storeId: 's2', promoterId: 'p2', industryId: 'i2' },
  ],
  promoters: [{ id: 'p1' }],
  imports: [{ id: 'm1', _count: { files: 1, previewArtifacts: 2, confirmations: 1 } }],
  evidences: [{ id: 'e1', importId: 'm1', audits: [{ id: 'a1' }, { id: 'a2' }] }],
};
const none: OperationCleanupSelection = { routes: false, visits: false, evidences: false, reconciliations: false, imports: false };

test('simulação separa roteiros planejados de visitas executadas', () => {
  const preview = buildCleanupPreview(record);
  assert.equal(preview.removable.routes, 1);
  assert.equal(preview.removable.visits, 2);
  assert.equal(preview.removable.evidences, 1);
  assert.equal(preview.removable.reconciliations, 2);
});

test('simulação preserva e deduplica lojas, promotores e indústrias', () => {
  assert.deepEqual(buildCleanupPreview(record).preserved, { stores: 2, promoters: 2, industries: 2 });
});

test('importação com evidência não pode ser removida isoladamente', () => {
  const preview = buildCleanupPreview(record, { ...none, imports: true });
  assert.equal(preview.unsafeReasons.length, 1);
});

test('importação pode ser removida junto com evidências', () => {
  const selection = { ...none, imports: true, evidences: true };
  const preview = buildCleanupPreview(record, selection);
  assert.deepEqual(preview.unsafeReasons, []);
  assert.equal(selectedCleanupCount(preview, selection), 2);
});

test('evidências absorvem a remoção de auditorias para evitar contagem dupla', () => {
  const selection = { ...none, evidences: true, reconciliations: true };
  assert.equal(selectedCleanupCount(buildCleanupPreview(record, selection), selection), 1);
});
