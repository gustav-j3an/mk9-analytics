import assert from 'node:assert/strict';
import test from 'node:test';
import { storeService } from './services/StoreService';
import { validateStoreData, validateStoreUpdateData } from './validators/store.validator';

test('valida cadastro completo e normaliza UF', () => {
  const result = validateStoreData({ code: 'L-1', name: 'Loja Centro', chain: 'Rede', address: 'Rua A, 10', city: 'Brasília', state: 'df' });
  assert.equal(result.state, 'DF');
  assert.equal(result.address, 'Rua A, 10');
});

test('edição parcial não exige código ou nome', () => {
  assert.deepEqual(validateStoreUpdateData({ city: 'Goiânia' }), { city: 'Goiânia' });
});

test('arquiva e restaura sem excluir a loja', async () => {
  const delegate = (await import('@/lib/prisma')).prisma.store;
  const originalFind = delegate.findUnique;
  const originalUpdate = delegate.update;
  const updates: unknown[] = [];
  Reflect.set(delegate, 'findUnique', async () => ({ id: 'store-1' }));
  Reflect.set(delegate, 'update', async (args: { data: Record<string, unknown> }) => { updates.push(args.data); return { id: 'store-1', ...args.data }; });
  try {
    const archived = await storeService.setArchived('store-1', true);
    const restored = await storeService.setArchived('store-1', false);
    assert.ok(archived.archivedAt instanceof Date);
    assert.equal(restored.archivedAt, null);
    assert.equal(updates.length, 2);
  } finally {
    Reflect.set(delegate, 'findUnique', originalFind);
    Reflect.set(delegate, 'update', originalUpdate);
  }
});
