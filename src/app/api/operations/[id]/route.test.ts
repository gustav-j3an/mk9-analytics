import assert from 'node:assert/strict';
import test from 'node:test';
import { DELETE, POST } from './route';
import { GET as CLEANUP_GET, POST as CLEANUP_POST } from './cleanup/route';

test('bloqueia arquivamento sem permissão administrativa', async () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, 'NODE_ENV', 'production');
  try {
    const response = await POST(
      new Request('http://localhost/api/operations/op-1?action=archive') as never,
      { params: Promise.resolve({ id: 'op-1' }) },
    );
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, 'ADMIN_AUTH_REQUIRED');
  } finally {
    Reflect.set(process.env, 'NODE_ENV', previous);
  }
});

test('bloqueia exclusão sem permissão administrativa', async () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, 'NODE_ENV', 'production');
  try {
    const response = await DELETE(
      new Request('http://localhost/api/operations/op-1', { method: 'DELETE', body: JSON.stringify({ confirmation: 'EXCLUIR OPERAÇÃO' }) }) as never,
      { params: Promise.resolve({ id: 'op-1' }) },
    );
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, 'ADMIN_AUTH_REQUIRED');
  } finally {
    Reflect.set(process.env, 'NODE_ENV', previous);
  }
});

test('bloqueia prévia e execução da limpeza sem permissão administrativa', async () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, 'NODE_ENV', 'production');
  try {
    const context = { params: Promise.resolve({ id: 'op-1' }) };
    const preview = await CLEANUP_GET(new Request('http://localhost/api/operations/op-1/cleanup'), context);
    const execution = await CLEANUP_POST(new Request('http://localhost/api/operations/op-1/cleanup', { method: 'POST', body: JSON.stringify({ routes: true, visits: true, evidences: true, reconciliations: true, imports: true }) }), context);
    assert.equal(preview.status, 403);
    assert.equal(execution.status, 403);
  } finally {
    Reflect.set(process.env, 'NODE_ENV', previous);
  }
});
