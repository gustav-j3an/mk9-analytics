import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { handleImportConfirmation } from './route';

const validBody = {
  previewToken: randomBytes(32).toString('base64url'),
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
};

test('retorna 400 para payload com campos extras', async () => {
  const request = new Request('http://localhost/api/imports/confirm', {
    method: 'POST',
    body: JSON.stringify({ ...validBody, rows: [] }),
  });
  assert.equal((await handleImportConfirmation(request)).status, 400);
});

test('retorna 400 para UUID inválido', async () => {
  const request = new Request('http://localhost/api/imports/confirm', {
    method: 'POST',
    body: JSON.stringify({ ...validBody, idempotencyKey: 'invalida' }),
  });
  assert.equal((await handleImportConfirmation(request)).status, 400);
});

test('registra falha inesperada e retorna código interno seguro', async () => {
  const request = new Request('http://localhost/api/imports/confirm', {
    method: 'POST',
    body: JSON.stringify(validBody),
  });
  const originalError = console.error;
  const logs: unknown[][] = [];
  console.error = (...args: unknown[]) => { logs.push(args); };
  try {
    const response = await handleImportConfirmation(request, async () => {
      throw Object.assign(new Error('detalhe interno'), { code: 'P2028' });
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      success: false,
      code: 'IMPORT_PERSISTENCE_FAILED',
      error: 'Não foi possível persistir a importação.',
    });
    assert.equal(logs.length, 1);
    assert.equal((logs[0][1] as { message: string }).message, 'detalhe interno');
    assert.equal((logs[0][1] as { code: string }).code, 'P2028');
  } finally {
    console.error = originalError;
  }
});
