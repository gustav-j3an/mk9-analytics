import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { RoteiroSyncService, normalizeStringForComparison } from './RoteiroSyncService';

test('normalizeStringForComparison remove acentos e deixa caixa baixa', () => {
  assert.equal(normalizeStringForComparison(' SAMILLE APARECIDA '), 'samille aparecida');
  assert.equal(normalizeStringForComparison('CONCILIAÇÃO'), 'conciliacao');
});

test('RoteiroSyncService.analyze detecta rotas novas e resolve cadastros', async () => {
  const originalFindManyPromoters = prisma.promoter.findMany;
  const originalFindManyStores = prisma.store.findMany;
  const originalFindManyIndustries = prisma.industry.findMany;
  const originalFindManyVisits = prisma.visit.findMany;
  const originalFindUniqueOperation = prisma.operation.findUnique;

  // Mocking database
  Reflect.set(prisma.promoter, 'findMany', async () => [
    { id: 'p-1', name: 'ANA LETICIA' }
  ]);
  Reflect.set(prisma.store, 'findMany', async () => [
    { id: 's-1', name: 'ASSAI GUNTER' }
  ]);
  Reflect.set(prisma.industry, 'findMany', async () => [
    { id: 'i-1', name: 'KING' }
  ]);
  Reflect.set(prisma.visit, 'findMany', async () => []);
  Reflect.set(prisma.operation, 'findUnique', async () => ({ id: 'op-1', startsAt: new Date(), endsAt: new Date() }));

  try {
    const preview = await RoteiroSyncService.analyze({
      rows: [
        {
          ABA: 'ROTEIRO LUCAS',
          INDUSTRIA: 'KING',
          LOJA: 'ASSAI GUNTER',
          PROMOTOR: 'ANA LETICIA',
          SEG: '✓',
          VISITA_SEMANAL: 1,
          SOURCE_ROW_NUMBER: 10
        }
      ],
      month: 7,
      year: 2026,
      syncMode: 'FULL_SYNC'
    });

    assert.equal(preview.routesNew > 0, true);
    assert.equal(preview.promotersNew, 0);
    assert.equal(preview.promoterMappings['ANA LETICIA']?.dbId, 'p-1');
  } finally {
    Reflect.set(prisma.promoter, 'findMany', originalFindManyPromoters);
    Reflect.set(prisma.store, 'findMany', originalFindManyStores);
    Reflect.set(prisma.industry, 'findMany', originalFindManyIndustries);
    Reflect.set(prisma.visit, 'findMany', originalFindManyVisits);
    Reflect.set(prisma.operation, 'findUnique', originalFindUniqueOperation);
  }
});
