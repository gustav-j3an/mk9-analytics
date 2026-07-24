import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { searchPromotersForRoute } from './RoutePromoterSearchService';

test('pesquisa de promotores inclui filtros de busca corretos para query >= 2 caracteres', async () => {
  const delegate = prisma.promoter;
  const originalFindMany = delegate.findMany;

  let findManyArgs: any = null;

  Reflect.set(delegate, 'findMany', async (args: any) => {
    findManyArgs = args;
    return [
      {
        id: 'p-1',
        name: 'Samille Ferreira',
        phone: '67999999999',
        email: 'samille@test.com',
        city: 'Campo Grande',
        state: 'MS',
        status: 'ACTIVE',
        operationId: 'op-1',
        visits: []
      }
    ];
  });

  try {
    const result = await searchPromotersForRoute({
      query: 'Samille',
      operationId: 'op-1',
      weekStart: new Date('2026-06-01T12:00:00Z'),
      weekEnd: new Date('2026-06-08T12:00:00Z'),
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Samille Ferreira');
    assert.equal(result[0].weekVisitCount, 0);
    assert.equal(result[0].alreadyInWeek, false);

    // Verify args format passed to Prisma
    assert.ok(findManyArgs);
    assert.equal(findManyArgs.take, 20);
    assert.ok(findManyArgs.where.AND);
  } finally {
    Reflect.set(delegate, 'findMany', originalFindMany);
  }
});

test('retorna promotor com zero visitas e calcula visitas na semana', async () => {
  const delegate = prisma.promoter;
  const originalFindMany = delegate.findMany;

  Reflect.set(delegate, 'findMany', async () => {
    return [
      {
        id: 'p-1',
        name: 'Ana',
        phone: null,
        email: null,
        city: 'Goiânia',
        state: 'GO',
        status: 'ACTIVE',
        operationId: 'op-1',
        visits: [{ id: 'v-1' }, { id: 'v-2' }]
      }
    ];
  });

  try {
    const result = await searchPromotersForRoute({
      query: 'Ana',
      weekStart: new Date('2026-06-01T12:00:00Z'),
      weekEnd: new Date('2026-06-08T12:00:00Z'),
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].weekVisitCount, 2);
    assert.equal(result[0].alreadyInWeek, true);
  } finally {
    Reflect.set(delegate, 'findMany', originalFindMany);
  }
});
