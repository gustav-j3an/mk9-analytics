import assert from 'node:assert/strict';
import test from 'node:test';
import * as XLSX from 'xlsx';
import { CsvStrategy } from './CsvStrategy';
import { ExcelStrategy } from './ExcelStrategy';
import { SpreadsheetType } from '../types/SpreadsheetType';
import type { ImportStrategy } from '../types/ImportStrategy';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { VISIT_TOTAL_COLUMN, countDetectedVisits } from '../utils/visit-markers';

function createWorkbook(rows: unknown[][]): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}

async function createPreview(strategy: ImportStrategy, data: ArrayBuffer) {
  const rawData = await strategy.parse(data);
  const detectedType = await strategy.detectType(rawData);
  const normalizedData = await strategy.normalize(rawData);
  const { valid, errors } = await strategy.validate(normalizedData);
  const { unique, duplicates } = await strategy.detectDuplicates(valid);
  const preview = await strategy.generatePreview(unique, duplicates, errors.length);

  return { rawData, detectedType, normalizedData, valid, errors, preview };
}

test('XLSX com cabeçalho na primeira linha', async () => {
  const result = await createPreview(new ExcelStrategy(), createWorkbook([
    ['NOME', 'CIDADE', 'ESTADO', 'SUPERVISOR'],
    ['Ana', 'Brasília', 'DF', 'Carlos'],
    [],
  ]));

  assert.equal(result.detectedType, SpreadsheetType.PROMOTORES);
  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(Object.keys(result.normalizedData[0]), ['NOME', 'CIDADE', 'ESTADO', 'SUPERVISOR']);
});

test('XLSX com linhas de título antes do cabeçalho ignora linhas vazias', async () => {
  const result = await createPreview(new ExcelStrategy(), createWorkbook([
    ['Relatório mensal'],
    [],
    ['NOME', 'CIDADE', 'ESTADO', 'SUPERVISOR'],
    ['Ana', 'Brasília', 'DF', 'Carlos'],
    [],
  ]));

  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 0);
  assert.equal(result.normalizedData[0].NOME, 'Ana');
});

test('CSV válido continua gerando preview', async () => {
  const csv = new TextEncoder().encode('NOME,CIDADE,ESTADO,SUPERVISOR\nAna,Brasilia,DF,Carlos\n').buffer;
  const result = await createPreview(new CsvStrategy(), csv);

  assert.equal(result.detectedType, SpreadsheetType.PROMOTORES);
  assert.equal(result.valid.length, 1);
  assert.equal(result.preview.previewData.length, 1);
});

test('linha incompleta é preservada pela validação existente', async () => {
  const result = await createPreview(new ExcelStrategy(), createWorkbook([
    ['NOME', 'CIDADE', 'ESTADO', 'SUPERVISOR'],
    ['Ana', 'Brasília', 'DF'],
  ]));

  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 0);
  assert.equal(result.normalizedData[0].SUPERVISOR, undefined);
});

test('colunas não reconhecidas retornam tipo desconhecido sem derrubar o preview', async () => {
  const result = await createPreview(new ExcelStrategy(), createWorkbook([
    ['CAMPO A', 'CAMPO B'],
    ['valor A', 'valor B'],
  ]));

  assert.equal(result.detectedType, SpreadsheetType.DESCONHECIDO);
  assert.equal(result.valid.length, 1);
  assert.deepEqual(Object.keys(result.normalizedData[0]), ['CAMPO_A', 'CAMPO_B']);
});

test('arquivo XLSX vazio não produz linhas', async () => {
  const result = await createPreview(new ExcelStrategy(), createWorkbook([]));

  assert.equal(result.rawData.length, 0);
  assert.equal(result.valid.length, 0);
  assert.equal(result.preview.previewData.length, 0);
});

const ROUTE_HEADERS = ['INDUSTRIA', 'LOJA', 'UF', 'VISITA_SEMANAL', 'VISITA_MENSAL', 'SUPERVISOR', 'PROMOTOR'];

async function validateRouteRow(row: unknown[]) {
  return createPreview(new ExcelStrategy(), createWorkbook([ROUTE_HEADERS, row]));
}

test('linha de roteiro completa é válida', async () => {
  const result = await validateRouteRow(['Indústria A', 'Loja A', 'DF', 1, null, 'Supervisor A', 'Promotor A']);
  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 0);
});

test('linha de roteiro sem INDUSTRIA é inválida', async () => {
  const result = await validateRouteRow([null, 'Loja A', 'DF', 1]);
  assert.equal(result.valid.length, 0);
  assert.equal(result.errors[0].field, 'INDUSTRIA');
  assert.match(result.errors[0].message, /obrigatório/);
});

test('linha de roteiro sem LOJA é inválida', async () => {
  const result = await validateRouteRow(['Indústria A', null, 'DF', 1]);
  assert.equal(result.valid.length, 0);
  assert.equal(result.errors[0].field, 'LOJA');
});

test('linha de roteiro sem UF é inválida', async () => {
  const result = await validateRouteRow(['Indústria A', 'Loja A', null, 1]);
  assert.equal(result.valid.length, 0);
  assert.equal(result.errors[0].field, 'UF');
});

test('linha de roteiro sem SUPERVISOR continua válida', async () => {
  const result = await validateRouteRow(['Indústria A', 'Loja A', 'DF', 1, null, null, 'Promotor A']);
  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 0);
});

test('linha de roteiro sem PROMOTOR continua válida', async () => {
  const result = await validateRouteRow(['Indústria A', 'Loja A', 'DF', 1, null, 'Supervisor A']);
  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 0);
});

test('linha de roteiro sem frequência é inválida quando as colunas existem', async () => {
  const result = await validateRouteRow(['Indústria A', 'Loja A', 'DF']);
  assert.equal(result.valid.length, 0);
  assert.equal(result.errors[0].field, 'VISITA_SEMANAL|VISITA_MENSAL');
});

test('linha vazia de roteiro continua ignorada', async () => {
  const result = await createPreview(new ExcelStrategy(), createWorkbook([ROUTE_HEADERS, ['Indústria A', 'Loja A', 'DF', 1], []]));
  assert.equal(result.normalizedData.length, 1);
  assert.equal(result.valid.length, 1);
});

test('XLSX com cabeçalho na linha 1 informa a linha física 2', async () => {
  const result = await validateRouteRow([null, 'Loja A', 'DF', 1]);
  assert.equal(result.errors[0].row, 2);
});

test('XLSX com cabeçalho na linha 6 informa a linha física 7', async () => {
  const result = await createPreview(new ExcelStrategy(), createWorkbook([
    [''],
    [],
    ['Relatório'],
    ['Referência'],
    ['SEG', 'TER'],
    ROUTE_HEADERS,
    [null, 'Loja A', 'DF', 1],
  ]));
  assert.equal(result.errors[0].row, 7);
});

test('XLSX informa a linha física de um erro posterior', async () => {
  const result = await createPreview(new ExcelStrategy(), createWorkbook([
    ROUTE_HEADERS,
    ['Indústria A', 'Loja A', 'DF', 1],
    ['Indústria B', null, 'DF', 1],
  ]));
  assert.equal(result.errors[0].row, 3);
});

test('CSV informa a linha física 2 para o primeiro registro', async () => {
  const csv = new TextEncoder().encode(
    'INDUSTRIA,LOJA,UF,VISITA_SEMANAL,VISITA_MENSAL\n,Loja A,DF,1,\n',
  ).buffer;
  const result = await createPreview(new CsvStrategy(), csv);
  assert.equal(result.errors[0].row, 2);
});

test('identificador interno não aparece nas colunas nem no JSON do preview', async () => {
  const result = await validateRouteRow(['Indústria A', 'Loja A', 'DF', 1]);
  const previewRow = result.preview.previewData[0];
  assert.equal(previewRow[SOURCE_ROW_NUMBER], 2);
  assert.equal(Object.keys(previewRow).includes('SOURCE_ROW_NUMBER'), false);
  assert.equal(JSON.stringify(previewRow).includes('sourceRowNumber'), false);
});

test('fórmula com resultado verdadeiro é exibida como visita', async () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['LOJA', '01/06/2026'],
    ['Loja A', null],
  ]);
  worksheet.B2 = { t: 'b', v: true, f: 'TRUE()' };
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const result = await createPreview(new ExcelStrategy(), data);

  assert.equal(result.normalizedData[0]['01_06_2026'], '✓');
  assert.equal(result.normalizedData[0][VISIT_TOTAL_COLUMN], 1);
});

test('planilha mensal real detecta as 28 visitas e preserva a linha física', async () => {
  const fixturePath = fileURLToPath(new URL('./fixtures/ao-quadrado-junho-2026.xlsx', import.meta.url));
  const bytes = readFileSync(fixturePath);
  const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const result = await createPreview(new ExcelStrategy(), data);

  assert.equal(countDetectedVisits(result.normalizedData), 28);
  const excelRow12 = result.normalizedData.find((row) => row[SOURCE_ROW_NUMBER] === 12);
  assert.ok(excelRow12);
  assert.equal(excelRow12[VISIT_TOTAL_COLUMN], 2);
  assert.equal(excelRow12['05_06_2026'], '✓');
  assert.equal(excelRow12['26_06_2026'], '✓');
});
