import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { ExcelStrategy } from '@/modules/imports/strategies/ExcelStrategy';
import { isVisitMarked } from '@/modules/imports/utils/visit-markers';
import { StoreMapper } from '@/modules/mapping/store/StoreMapper';
import { IndustryMapper } from '@/modules/mapping/industry/IndustryMapper';
import { PromoterMapper } from '@/modules/mapping/promoter/PromoterMapper';
import { OperationMapper } from '@/modules/mapping/operation/OperationMapper';
import { WeeklyPlanner } from '@/modules/routes/planning/WeeklyPlanner';
import { canonicalize } from '@/modules/shared/normalization';

async function rows(file: string) {
  const buffer = fs.readFileSync('test-fixtures/' + file);
  const array = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const strategy = new ExcelStrategy();
  return strategy.normalize(await strategy.parse(array));
}

test('fixtures reais conciliam KING com o roteiro e identificam promotores', async () => {
  const routeRows = await rows('MK9 - ROTEIRO PROMOTORES 2026.xlsx');
  const planned = [];
  const operation = { startsAt: new Date('2026-06-01T12:00:00Z'), endsAt: new Date('2026-06-30T12:00:00Z') };
  for (const row of routeRows) {
    const store = StoreMapper.map({ CODIGO: canonicalize(String(row.LOJA)), NOME: String(row.LOJA), CIDADE: '', UF: String(row.UF), REDE: null, BAIRRO: null });
    const industry = IndustryMapper.map({ CODIGO: canonicalize(String(row.INDUSTRIA)), NOME: String(row.INDUSTRIA) });
    const promoter = PromoterMapper.map({ PROMOTOR: String(row.PROMOTOR), SUPERVISOR: null });
    if (promoter) planned.push(...WeeklyPlanner.plan({ row, store, industry, promoter }, operation));
  }
  const unique = OperationMapper.map([], [], [], planned).visits;
  const exact = new Map(unique.map((visit) => [[visit.store.code, visit.industry.code, visit.scheduledDate?.toISOString().slice(0, 10)].join('|'), visit]));
  let evidence = 0;
  const matches = [];
  for (const row of await rows('KING CHECKLIST JUNHO 2026.xlsx')) {
    for (const [column, value] of Object.entries(row)) {
      const date = /^(\d{2})_(\d{2})_(\d{4})$/.exec(column);
      if (!date || !isVisitMarked(value)) continue;
      evidence++;
      const key = [canonicalize(String(row.LOJA)), 'KING', date[3] + '-' + date[2] + '-' + date[1]].join('|');
      const match = exact.get(key);
      if (match) matches.push(match);
    }
  }
  assert.equal(unique.length, 498);
  assert.equal(evidence, 363);
  assert.equal(matches.length, 12);
  assert.ok(matches.some((match) => match.promoter?.name));
});
