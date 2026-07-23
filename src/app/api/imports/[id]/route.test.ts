import assert from 'node:assert/strict';
import test from 'node:test';
import { handleDeleteImport } from './route';

const id = 'cmimport000000000000000001';
const request = () => new Request(`http://localhost/api/imports/${id}`, {
  method: 'DELETE',
  body: JSON.stringify({ confirmation: 'EXCLUIR', idempotencyKey: 'request-123' }),
});
const context = { params: Promise.resolve({ id }) };

test('ADMIN consegue excluir', async () => {
  let called = false;
  const response = await handleDeleteImport(request(), context, () => ({ authorized: true, actor: 'admin-1' }), async () => {
    called = true;
    return { success: true, importId: id, alreadyDeleted: false, removed: { imports: 1, files: 1, previews: 1, confirmations: 1, evidences: 0, reconciliationAudits: 0, visits: 0, stores: 0, industries: 0, promoters: 0, operations: 0 } };
  });
  assert.equal(response.status, 200);
  assert.equal(called, true);
});

test('usuário não autorizado recebe 403 sem executar exclusão', async () => {
  let called = false;
  const response = await handleDeleteImport(request(), context, () => ({ authorized: false, actor: 'user-1' }), async () => {
    called = true;
    throw new Error('should not run');
  });
  assert.equal(response.status, 403);
  assert.equal(called, false);
  assert.equal((await response.json()).code, 'ADMIN_AUTH_REQUIRED');
});

test('ID inválido retorna 404', async () => {
  const response = await handleDeleteImport(request(), { params: Promise.resolve({ id: 'invalid' }) }, () => ({ authorized: true, actor: 'admin-1' }));
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, 'IMPORT_NOT_FOUND');
});
