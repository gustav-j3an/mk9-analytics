import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from './route';

test('usuário sem permissão não salva roteiro', async () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, 'NODE_ENV', 'production');
  try {
    const response = await POST(new Request('http://localhost/api/routes/week', { method: 'POST', body: '{}' }));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, 'ADMIN_AUTH_REQUIRED');
  } finally {
    Reflect.set(process.env, 'NODE_ENV', previous);
  }
});

test('payload de lote inválido é rejeitado antes de persistir', async () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, 'NODE_ENV', 'development');
  try {
    const response = await POST(new Request('http://localhost/api/routes/week', { method: 'POST', body: JSON.stringify({ upserts: [], deleteIds: [] }) }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'INVALID_ROUTE');
  } finally {
    Reflect.set(process.env, 'NODE_ENV', previous);
  }
});
