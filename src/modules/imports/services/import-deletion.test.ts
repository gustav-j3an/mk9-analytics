import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deleteImportRecord,
  ImportDeleteError,
  type ImportDeletionResult,
  type ImportDeletionStore,
  type ImportDeletionTransaction,
  unsafeRollbackPreview,
} from './ImportDeletionService';

const importId = 'cmimport000000000000000001';

const now = new Date('2026-07-23T18:00:00.000Z');

function createStore(options: { status?: string; missing?: boolean; failDelete?: boolean; preview?: 'active' | 'expired' | 'none'; updatedAt?: Date } = {}) {
  const calls: string[] = [];
  let completed: ImportDeletionResult | null = null;
  const tx: ImportDeletionTransaction = {
    findImport: async () => options.missing ? null : ({
      id: importId,
      status: options.status ?? 'SUCCESS',
      operationId: 'op-1',
      createdAt: new Date(),
      updatedAt: options.updatedAt ?? new Date(now.getTime() - 60 * 60 * 1000),
      files: [{ fileName: 'teste.xlsx' }],
      previewArtifacts: options.preview === 'none' || !options.preview ? [] : [{
        expiresAt: new Date(now.getTime() + (options.preview === 'active' ? 60_000 : -60_000)),
        consumedAt: null,
      }],
    }),
    countDependencies: async () => ({ files: 1, previews: 1, confirmations: 1, evidences: 2, reconciliationAudits: 3 }),
    deleteDependencies: async () => { calls.push('dependencies'); },
    deleteImport: async () => { calls.push('import'); if (options.failDelete) throw new Error('database failure'); },
    writeAudit: async () => { calls.push('audit'); },
  };
  const store: ImportDeletionStore = {
    findCompletedByIdempotencyKey: async () => completed,
    transaction: async (work) => work(tx),
  };
  return { store, calls, setCompleted: (value: ImportDeletionResult) => { completed = value; } };
}

const input = { id: importId, confirmation: 'EXCLUIR', actor: 'admin-1', idempotencyKey: 'request-123' };

test('exclui somente agregado da importação e mantém contagens operacionais em zero', async () => {
  const fixture = createStore();
  const result = await deleteImportRecord(input, fixture.store);
  assert.deepEqual(fixture.calls, ['dependencies', 'import', 'audit']);
  assert.equal(result.removed.evidences, 2);
  assert.equal(result.removed.reconciliationAudits, 3);
  assert.equal(result.removed.visits, 0);
  assert.equal(result.removed.stores, 0);
  assert.equal(result.removed.industries, 0);
  assert.equal(result.removed.promoters, 0);
  assert.equal(result.removed.operations, 0);
});

test('importação inexistente retorna erro 404', async () => {
  await assert.rejects(() => deleteImportRecord(input, createStore({ missing: true }).store), (error: ImportDeleteError) => error.code === 'IMPORT_NOT_FOUND' && error.httpStatus === 404);
});

test('processamento realmente ativo sem preview não pode ser excluído', async () => {
  const fixture = createStore({ status: 'PROCESSING', preview: 'none', updatedAt: new Date(now.getTime() - 1_000) });
  await assert.rejects(() => deleteImportRecord(input, fixture.store, now), (error: ImportDeleteError) => error.code === 'IMPORT_PROCESSING_ACTIVE' && error.httpStatus === 409);
});

test('exclui EXPIRED derivado de PROCESSING com preview vencido', async () => {
  const fixture = createStore({ status: 'PROCESSING', preview: 'expired' });
  const result = await deleteImportRecord(input, fixture.store, now);
  assert.equal(result.success, true);
  assert.deepEqual(fixture.calls, ['dependencies', 'import', 'audit']);
});

test('exclui EXPIRED sem preview quando processamento ficou órfão', async () => {
  const fixture = createStore({ status: 'PROCESSING', preview: 'none', updatedAt: new Date(now.getTime() - 31 * 60 * 1000) });
  assert.equal((await deleteImportRecord(input, fixture.store, now)).success, true);
});

for (const status of ['FAILED', 'PENDING', 'COMPLETED', 'SUCCESS', 'CANCELLED']) {
  test(`permite excluir status ${status}`, async () => {
    assert.equal((await deleteImportRecord(input, createStore({ status }).store, now)).success, true);
  });
}

test('confirmação incorreta é bloqueada', async () => {
  await assert.rejects(() => deleteImportRecord({ ...input, confirmation: 'excluir' }, createStore().store), (error: ImportDeleteError) => error.code === 'IMPORT_DELETE_FORBIDDEN');
});

test('chave repetida devolve o resultado anterior sem nova transação', async () => {
  const fixture = createStore();
  const prior: ImportDeletionResult = { success: true, importId, alreadyDeleted: true, removed: { imports: 1, files: 1, previews: 1, confirmations: 1, evidences: 0, reconciliationAudits: 0, visits: 0, stores: 0, industries: 0, promoters: 0, operations: 0 } };
  fixture.setCompleted(prior);
  assert.deepEqual(await deleteImportRecord(input, fixture.store), prior);
  assert.deepEqual(fixture.calls, []);
});

test('falha intermediária não grava auditoria de sucesso e retorna código seguro', async () => {
  const fixture = createStore({ failDelete: true });
  await assert.rejects(() => deleteImportRecord(input, fixture.store), (error: ImportDeleteError) => error.code === 'IMPORT_DELETE_FAILED');
  assert.deepEqual(fixture.calls, ['dependencies', 'import']);
});

test('rollback destrutivo permanece bloqueado sem rastreabilidade exclusiva', () => {
  assert.equal(unsafeRollbackPreview.safe, false);
  assert.equal(unsafeRollbackPreview.code, 'IMPORT_ROLLBACK_UNSAFE');
});
