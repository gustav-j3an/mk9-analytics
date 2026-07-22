import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { ExcelStrategy } from './ExcelStrategy';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { countDetectedVisits, VISIT_TOTAL_COLUMN } from '../utils/visit-markers';
import { StoreMapper } from '@/modules/mapping/store/StoreMapper';
import { IndustryMapper } from '@/modules/mapping/industry/IndustryMapper';
import { PromoterMapper } from '@/modules/mapping/promoter/PromoterMapper';
import { OperationMapper } from '@/modules/mapping/operation/OperationMapper';
import { WeeklyPlanner } from '@/modules/routes/planning/WeeklyPlanner';
import { canonicalize } from '@/modules/shared/normalization';

async function realFixture() {
  const fixturePath = path.join(process.cwd(), 'test-fixtures', 'MK9 - ROTEIRO PROMOTORES 2026.xlsx');
  const file = fs.readFileSync(fixturePath);
  const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  const strategy = new ExcelStrategy();
  const raw = await strategy.parse(arrayBuffer);
  const rows = await strategy.normalize(raw);
  return { strategy, raw, rows, arrayBuffer };
}

test('detecta automaticamente as duas abas estruturais de roteiro', async () => {
  const data = await realFixture();
  assert.equal(await data.strategy.detectType(data.raw), SpreadsheetType.ROTEIRO_PROMOTORES);
  assert.deepEqual(await data.strategy.getSheetNames(data.arrayBuffer), ['ROTEIRO LUCAS', 'ROTEIRO ALEXANDRE']);
});

test('normaliza as 396 linhas reais e as 499 marcações semanais', async () => {
  const { rows, strategy } = await realFixture();
  const validation = await strategy.validate(rows);
  assert.equal(rows.length, 396);
  assert.equal(validation.valid.length, 396);
  assert.equal(validation.errors.length, 0);
  assert.equal(countDetectedVisits(rows), 499);
  assert.equal(new Set(rows.map((row) => String(row.PROMOTOR).trim())).size, 26);
  assert.ok(rows.every((row) => Number(row[VISIT_TOTAL_COLUMN]) === Number(row.VISITA_SEMANAL)));
});

test('WeeklyPlanner respeita frequência, ignora domingo e remove a duplicidade real', async () => {
  const { rows } = await realFixture();
  const stores = [];
  const industries = [];
  const promoters = [];
  const visits = [];
  const operation = { startsAt: new Date('2026-06-01T12:00:00.000Z'), endsAt: new Date('2026-06-30T12:00:00.000Z') };
  for (const row of rows) {
    const storeName = String(row.LOJA).trim();
    const industryName = String(row.INDUSTRIA).trim();
    const store = StoreMapper.map({ CODIGO: canonicalize(storeName), NOME: storeName, CIDADE: '', UF: String(row.UF), REDE: null, BAIRRO: null });
    const industry = IndustryMapper.map({ CODIGO: canonicalize(industryName), NOME: industryName });
    const promoter = PromoterMapper.map({ PROMOTOR: String(row.PROMOTOR), SUPERVISOR: null });
    assert.ok(promoter);
    stores.push(store);
    industries.push(industry);
    promoters.push(promoter);
    const planned = WeeklyPlanner.plan({ row, store, industry, promoter }, operation);
    assert.ok(planned.length <= Number(row.VISITA_SEMANAL));
    assert.ok(planned.every((visit) => visit.scheduledDate?.getUTCDay() !== 0));
    visits.push(...planned);
  }
  const candidate = OperationMapper.map(stores, industries, promoters, visits);
  assert.equal(visits.length, 499);
  assert.equal(candidate.visits.length, 498);
  assert.equal(candidate.statistics.duplicatedVisits, 1);
  assert.equal(candidate.stores.length, 172);
  assert.equal(candidate.industries.length, 21);
  assert.equal(candidate.promoters.length, 26);
});
