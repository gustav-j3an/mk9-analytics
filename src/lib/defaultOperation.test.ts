import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrCreateDefaultOperationId, getOrCreateDefaultOperationIdInTx } from './defaultOperation';
import { prisma } from './prisma';

test('cria a operação padrão se ela não existe', async () => {
  const delegate = prisma.operation;
  const originalFindFirst = delegate.findFirst;
  const originalCreate = delegate.create;

  let findFirstCalled = false;
  let createCalled = false;

  Reflect.set(delegate, 'findFirst', async () => {
    findFirstCalled = true;
    return null;
  });

  Reflect.set(delegate, 'create', async (args: any) => {
    createCalled = true;
    assert.equal(args.data.name, 'MK9 - OPERAÇÃO PADRÃO');
    assert.equal(args.data.status, 'OPEN');
    return { id: 'mock-new-id' };
  });

  try {
    const id = await getOrCreateDefaultOperationId();
    assert.equal(id, 'mock-new-id');
    assert.ok(findFirstCalled);
    assert.ok(createCalled);
  } finally {
    Reflect.set(delegate, 'findFirst', originalFindFirst);
    Reflect.set(delegate, 'create', originalCreate);
  }
});

test('retorna a operação existente se ela já existe', async () => {
  const delegate = prisma.operation;
  const originalFindFirst = delegate.findFirst;
  const originalCreate = delegate.create;

  let findFirstCalled = false;
  let createCalled = false;

  Reflect.set(delegate, 'findFirst', async () => {
    findFirstCalled = true;
    return { id: 'mock-existing-id' };
  });

  Reflect.set(delegate, 'create', async () => {
    createCalled = true;
    return { id: 'mock-new-id' };
  });

  try {
    const id = await getOrCreateDefaultOperationId();
    assert.equal(id, 'mock-existing-id');
    assert.ok(findFirstCalled);
    assert.ok(!createCalled);
  } finally {
    Reflect.set(delegate, 'findFirst', originalFindFirst);
    Reflect.set(delegate, 'create', originalCreate);
  }
});
