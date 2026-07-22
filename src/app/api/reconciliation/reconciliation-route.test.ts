import assert from 'node:assert/strict';
import test from 'node:test';
import { PATCH } from './[id]/route';

test('bloqueia mutacoes administrativas fora de development', async () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, 'NODE_ENV', 'production');
  try {
    const request = new Request('http://localhost/api/reconciliation/e1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'REPROCESS' }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 'e1' }) });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: 'ADMIN_AUTH_REQUIRED' });
  } finally {
    Reflect.set(process.env, 'NODE_ENV', previous);
  }
});
