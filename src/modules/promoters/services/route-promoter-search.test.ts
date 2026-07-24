import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { normalizePromoterSearch, searchPromotersForRoute } from './RoutePromoterSearchService';

test('normaliza busca sem diferenciar a capitalização enviada', () => {
  assert.equal(normalizePromoterSearch('  SaMiLLe  Ferreira '), 'SaMiLLe Ferreira');
});

test('pesquisa nome, telefone, email, cidade e UF e inclui não vinculados', async () => {
  const delegate = prisma.promoter;
  const original = delegate.findMany;
  let where: unknown;
  Reflect.set(delegate, 'findMany', async (args: { where: unknown }) => {
    where = args.where;
    return [{ id: 'p1', name: 'SAMILLE', phone: null, email: null, city: 'Campo Grande', state: 'MS', status: 'ACTIVE', operationId: null, visits: [] }];
  });
  try {
    const items = await searchPromotersForRoute({ query: 'samille', operationId: 'op1', weekStart: new Date('2026-07-20'), weekEnd: new Date('2026-07-26') });
    assert.equal(items[0].alreadyInWeek, false);
    assert.equal(items[0].weekVisitCount, 0);
    assert.match(JSON.stringify(where), /name/);
    assert.match(JSON.stringify(where), /city/);
    assert.match(JSON.stringify(where), /email/);
    assert.match(JSON.stringify(where), /"operationId":null/);
  } finally {
    Reflect.set(delegate, 'findMany', original);
  }
});

test('promotor já presente na semana é marcado e contabilizado', async () => {
  const delegate = prisma.promoter;
  const original = delegate.findMany;
  Reflect.set(delegate, 'findMany', async () => [{ id: 'p1', name: 'Ana', phone: null, email: null, city: null, state: null, status: 'ACTIVE', operationId: 'op1', visits: [{ id: 'v1' }, { id: 'v2' }] }]);
  try {
    const [item] = await searchPromotersForRoute({ weekStart: new Date('2026-07-20'), weekEnd: new Date('2026-07-26') });
    assert.equal(item.alreadyInWeek, true);
    assert.equal(item.weekVisitCount, 2);
  } finally {
    Reflect.set(delegate, 'findMany', original);
  }
});
