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

test('RoteiroSyncService.analyze identifica rota existente alterada, removida e preservada', async () => {
  const originalFindManyPromoters = prisma.promoter.findMany;
  const originalFindManyStores = prisma.store.findMany;
  const originalFindManyIndustries = prisma.industry.findMany;
  const originalFindManyVisits = prisma.visit.findMany;

  Reflect.set(prisma.promoter, 'findMany', async () => [{ id: 'p-1', name: 'ANA LETICIA' }]);
  Reflect.set(prisma.store, 'findMany', async () => [{ id: 's-1', name: 'ASSAI GUNTER' }]);
  Reflect.set(prisma.industry, 'findMany', async () => [{ id: 'i-1', name: 'KING' }]);

  // Mocking existing database visits
  // We'll return 3 visits:
  // 1. One matching the spreadsheet SEG (Mon July 6, 2026) but with weeklyFrequency=2 (altered)
  // 2. One planned on TER (Tue July 7, 2026) but absent in spreadsheet (should be removed)
  // 3. One completed/realized on QUA (Wed July 8, 2026) absent in spreadsheet (should be preserved)
  Reflect.set(prisma.visit, 'findMany', async () => [
    {
      id: 'v-1',
      promoterId: 'p-1',
      storeId: 's-1',
      industryId: 'i-1',
      scheduledDate: new Date('2026-07-06T12:00:00.000Z'),
      weeklyFrequency: 2,
      status: 'PLANEJADA',
      completedAt: null,
      promoter: { name: 'ANA LETICIA' },
      store: { name: 'ASSAI GUNTER', state: 'MS' },
      industry: { name: 'KING' }
    },
    {
      id: 'v-2',
      promoterId: 'p-1',
      storeId: 's-1',
      industryId: 'i-1',
      scheduledDate: new Date('2026-07-07T12:00:00.000Z'),
      weeklyFrequency: 1,
      status: 'PLANEJADA',
      completedAt: null,
      promoter: { name: 'ANA LETICIA' },
      store: { name: 'ASSAI GUNTER', state: 'MS' },
      industry: { name: 'KING' }
    },
    {
      id: 'v-3',
      promoterId: 'p-1',
      storeId: 's-1',
      industryId: 'i-1',
      scheduledDate: new Date('2026-07-08T12:00:00.000Z'),
      weeklyFrequency: 1,
      status: 'REALIZADA',
      completedAt: new Date(),
      promoter: { name: 'ANA LETICIA' },
      store: { name: 'ASSAI GUNTER', state: 'MS' },
      industry: { name: 'KING' }
    }
  ]);

  try {
    const preview = await RoteiroSyncService.analyze({
      rows: [
        {
          ABA: 'ROTEIRO LUCAS',
          INDUSTRIA: 'KING',
          LOJA: 'ASSAI GUNTER',
          PROMOTOR: 'ANA LETICIA',
          SEG: '✓', // July 6, 13, 20, 27
          VISITA_SEMANAL: 1,
          SOURCE_ROW_NUMBER: 10
        }
      ],
      month: 7,
      year: 2026,
      syncMode: 'FULL_SYNC'
    });

    // Check that we detected the altered visit (frequency mismatch)
    const jul6Item = preview.items.find(x => x.date === '2026-07-06');
    assert.ok(jul6Item);
    assert.equal(jul6Item.status, 'ALTERADO');
    assert.equal(jul6Item.action, 'UPDATE');

    // Check removals/preservations
    const jul7Item = preview.items.find(x => x.date === '2026-07-07');
    assert.ok(jul7Item);
    assert.equal(jul7Item.status, 'REMOVIDO_DA_PLANILHA');
    assert.equal(jul7Item.action, 'DELETE');

    const jul8Item = preview.items.find(x => x.date === '2026-07-08');
    assert.ok(jul8Item);
    assert.equal(jul8Item.status, 'VISITA_JÁ_REALIZADA');
    assert.equal(jul8Item.action, 'KEEP');

  } finally {
    Reflect.set(prisma.promoter, 'findMany', originalFindManyPromoters);
    Reflect.set(prisma.store, 'findMany', originalFindManyStores);
    Reflect.set(prisma.industry, 'findMany', originalFindManyIndustries);
    Reflect.set(prisma.visit, 'findMany', originalFindManyVisits);
  }
});
