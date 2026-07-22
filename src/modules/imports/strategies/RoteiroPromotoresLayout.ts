import * as XLSX from 'xlsx';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type { NormalizedImportRow } from '../types/ImportPreview';
import type { SpreadsheetCell } from '../types/SpreadsheetCell';
import { getCellValue } from '../types/SpreadsheetCell';
import { isVisitMarked, VISIT_TOTAL_COLUMN } from '../utils/visit-markers';

export const ROUTE_WEEKDAY_COLUMNS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] as const;
const REQUIRED_HEADERS = ['INDUSTRIA', 'LOJA', 'UF', 'PROMOTORES', ...ROUTE_WEEKDAY_COLUMNS] as const;

interface RouteSheetData {
  name: string;
  headerRowIndex: number;
  rows: SpreadsheetCell[][];
}

export interface RouteWorkbookData {
  kind: 'MK9_ROTEIRO_PROMOTORES';
  sheets: RouteSheetData[];
}

function normalizeHeader(value: unknown): string {
  return String(getCellValue(value) ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function worksheetToRows(worksheet: XLSX.WorkSheet): SpreadsheetCell[][] {
  if (!worksheet['!ref']) return [];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const rows: SpreadsheetCell[][] = [];
  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row: SpreadsheetCell[] = [];
    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })] as XLSX.CellObject | undefined;
      row[columnIndex - range.s.c] = { value: cell?.v, formattedValue: cell?.w, formula: cell?.f, type: cell?.t };
    }
    rows.push(row);
  }
  return rows;
}

function findHeaderRow(rows: SpreadsheetCell[][]): number {
  for (let index = 0; index < Math.min(20, rows.length); index += 1) {
    const headers = new Set(rows[index].map(normalizeHeader));
    if (REQUIRED_HEADERS.every((header) => headers.has(header))) return index;
  }
  return -1;
}

export function parseRouteWorkbook(buffer: Buffer): RouteWorkbookData | null {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets = workbook.SheetNames.flatMap((name) => {
    const rows = worksheetToRows(workbook.Sheets[name]);
    const headerRowIndex = findHeaderRow(rows);
    return headerRowIndex >= 0 ? [{ name, headerRowIndex, rows }] : [];
  });
  return sheets.length > 0 ? { kind: 'MK9_ROTEIRO_PROMOTORES', sheets } : null;
}

export function isRouteWorkbookData(data: unknown[]): data is [RouteWorkbookData] {
  const value = data[0] as Partial<RouteWorkbookData> | undefined;
  return data.length === 1 && value?.kind === 'MK9_ROTEIRO_PROMOTORES' && Array.isArray(value.sheets);
}

function numberValue(value: unknown): number {
  const parsed = Number(getCellValue(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeRouteWorkbook(data: RouteWorkbookData): NormalizedImportRow[] {
  const normalized: NormalizedImportRow[] = [];
  for (const sheet of data.sheets) {
    const header = sheet.rows[sheet.headerRowIndex];
    const headers = header.map(normalizeHeader);
    const indexOf = (name: string) => headers.indexOf(name);
    for (let rowIndex = sheet.headerRowIndex + 1; rowIndex < sheet.rows.length; rowIndex += 1) {
      const row = sheet.rows[rowIndex];
      const industria = getCellValue(row[indexOf('INDUSTRIA')]);
      const loja = getCellValue(row[indexOf('LOJA')]);
      const uf = getCellValue(row[indexOf('UF')]);
      const promoter = getCellValue(row[indexOf('PROMOTORES')]);
      if ([industria, loja, uf, promoter].every((value) => value === null || value === undefined || String(value).trim() === '')) continue;
      const output: NormalizedImportRow = {
        ABA: sheet.name,
        INDUSTRIA: industria,
        LOJA: loja,
        UF: uf,
        PROMOTOR: promoter,
      };
      let detected = 0;
      for (const weekday of ROUTE_WEEKDAY_COLUMNS) {
        const marked = isVisitMarked(getCellValue(row[indexOf(weekday)]));
        output[weekday] = marked ? '✓' : '-';
        if (marked) detected += 1;
      }
      output.VISITA_SEMANAL = numberValue(row[indexOf('VISITAS_SEM_REALIZADO')]);
      output.VISITA_MENSAL = numberValue(row[indexOf('FREQ_MENSAL_REALIZADA_EST')]);
      output[VISIT_TOTAL_COLUMN] = detected;
      output[SOURCE_ROW_NUMBER] = rowIndex + 1;
      normalized.push(output);
    }
  }
  return normalized;
}

export function detectedRouteSheetNames(data: unknown[]): string[] {
  return isRouteWorkbookData(data) ? data[0].sheets.map((sheet) => sheet.name) : [];
}
