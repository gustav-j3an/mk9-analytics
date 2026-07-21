import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import * as XLSX from 'xlsx';
import { ExcelStrategy } from './ExcelStrategy';
import { findKingHeaderRowIndex, KING_WARNING_COLUMN, normalizeKingDateHeader } from './KingChecklistLayout';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import { getCellValue } from '../types/SpreadsheetCell';
import { countDetectedVisits, VISIT_TOTAL_COLUMN } from '../utils/visit-markers';

function workbookData(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ['KING CHECKLIST JUNHO 2026'], [], ['Periodo'], ['SAB', 'DOM'],
    ['BANDEIRA', 'LOJA', 'UF', 'VISITA SEMANAL', 'VISITA MENSAL', '23/05/2026', 46171, 'REALIZADO'],
    ['REDE A', 'LOJA A', 'DF', '1', '', '✅', '', 2],
    ['', 'LOJA B', 'GO', 0, 0, '', '✅', 1],
    ['REDE B', 'LOJA C', 'BA', 0, 0, '', '', 0],
    ['REDE C', '', 'SP', 1, 0, '', '', 0],
    ['REDE D', 'LOJA D', '', 1, 0, '', '', 0],
    [], ['', 'LOJA E', 'SP', 1, 0, '', '', 0],
    ['TOTAL VISITAS MES REALIZADO', '', '', '', '', '', '', 3],
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'KING JUNHO 2026');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}

async function result() {
  const strategy = new ExcelStrategy();
  const raw = await strategy.parse(workbookData());
  const rows = await strategy.normalize(raw);
  const validation = await strategy.validate(rows);
  return { strategy, raw, rows, ...validation };
}

test('KING detecta o cabeçalho real na linha 5 sem depender do nome do arquivo', async () => {
  const data = await result();
  assert.equal(findKingHeaderRowIndex(data.raw), 4);
  assert.equal(await data.strategy.detectType(data.raw), SpreadsheetType.KING_CHECKLIST);
});

test('KING mapeia BANDEIRA para INDUSTRIA', async () => {
  assert.equal((await result()).rows[0].INDUSTRIA, 'REDE A');
});

test('KING aplica fill-down somente à BANDEIRA e interrompe em linha vazia', async () => {
  const rows = (await result()).rows;
  assert.equal(rows[1].INDUSTRIA, 'REDE A');
  assert.equal(rows.find((row) => row.LOJA === 'LOJA E')?.INDUSTRIA, null);
});

test('KING normaliza data textual DD/MM/YYYY', async () => {
  assert.equal((await result()).rows[0]['23_05_2026'], '✓');
});

test('KING converte data serial do Excel', () => {
  assert.equal(normalizeKingDateHeader(46171), '29_05_2026');
});

test('KING reconhece ✅ e soma visitas', async () => {
  const rows = (await result()).rows;
  assert.equal(rows[0][VISIT_TOTAL_COLUMN], 1);
  assert.equal(countDetectedVisits(rows), 2);
});

test('KING mantém válida uma linha sem marcação de visita', async () => {
  const data = await result();
  assert.ok(data.valid.some((row) => row.LOJA === 'LOJA C' && row[VISIT_TOTAL_COLUMN] === 0));
});

test('KING invalida linha sem LOJA preservando a linha física', async () => {
  const data = await result();
  assert.ok(data.errors.some((error) => error.field === 'LOJA' && error.row === 9));
});

test('KING invalida linha sem UF', async () => {
  assert.ok((await result()).errors.some((error) => error.field === 'UF' && error.row === 10));
});

test('KING divergência de REALIZADO gera warning sem invalidar a linha', async () => {
  const data = await result();
  assert.match(String(data.rows[0][KING_WARNING_COLUMN]), /difere/);
  assert.ok(data.valid.some((row) => row[SOURCE_ROW_NUMBER] === 6));
});

test('KING ignora total e mantém frequências numéricas', async () => {
  const rows = (await result()).rows;
  assert.equal(rows.some((row) => String(row.INDUSTRIA).includes('TOTAL')), false);
  assert.equal(rows[0].VISITA_SEMANAL, 1);
  assert.equal(rows[0].VISITA_MENSAL, 0);
});

test('KING processa o arquivo real preservando preview e métricas', async () => {
  const fixturePath = path.join(process.cwd(), 'test-fixtures', 'KING CHECKLIST JUNHO 2026.xlsx');
  const file = fs.readFileSync(fixturePath);
  const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  const strategy = new ExcelStrategy();
  const raw = await strategy.parse(arrayBuffer);
  const rows = await strategy.normalize(raw);
  const validation = await strategy.validate(rows);
  const invalidRows = new Set(validation.errors.map((error) => error.row));
  const dateColumns = Object.keys(rows[0]).filter((column) => /^\d{2}_\d{2}_\d{4}$/.test(column));
  const fillDownRows = rows.filter((row) => {
    const sourceRow = Number(row[SOURCE_ROW_NUMBER]);
    const rawRow = raw[sourceRow - 1];
    const rawBandeira = Array.isArray(rawRow) ? getCellValue(rawRow[0]) : null;
    return (rawBandeira === null || rawBandeira === undefined || String(rawBandeira).trim() === '')
      && String(row.INDUSTRIA ?? '').trim() !== '';
  });
  const preview = await strategy.generatePreview(validation.valid, [], invalidRows.size);

  assert.deepEqual(await strategy.getSheetNames(arrayBuffer), ['KING JUNHO 2026']);
  assert.equal(findKingHeaderRowIndex(raw), 4);
  assert.equal(await strategy.detectType(raw), SpreadsheetType.KING_CHECKLIST);
  assert.equal(rows.length, 141);
  assert.equal(validation.valid.length, 141);
  assert.equal(invalidRows.size, 0);
  assert.equal(countDetectedVisits(rows), 363);
  assert.equal(rows.filter((row) => Number(row[VISIT_TOTAL_COLUMN]) > 0).length, 116);
  assert.equal(rows.filter((row) => Boolean(row[KING_WARNING_COLUMN])).length, 0);
  assert.equal(fillDownRows.length, 40);
  assert.equal(dateColumns.length, 31);
  assert.equal(dateColumns[0], '23_05_2026');
  assert.equal(dateColumns.at(-1), '22_06_2026');
  assert.deepEqual(
    Object.keys(rows[0]),
    ['INDUSTRIA', 'LOJA', 'UF', 'VISITA_SEMANAL', 'VISITA_MENSAL', ...dateColumns, 'REALIZADO', VISIT_TOTAL_COLUMN, KING_WARNING_COLUMN],
  );
  assert.equal(rows.some((row) => dateColumns.some((column) => row[column] === '✓')), true);
  assert.deepEqual(preview.previewData, rows);
});
