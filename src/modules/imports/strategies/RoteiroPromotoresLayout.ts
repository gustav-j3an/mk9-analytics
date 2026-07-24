import * as XLSX from 'xlsx';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type { NormalizedImportRow } from '../types/ImportPreview';
import type { SpreadsheetCell } from '../types/SpreadsheetCell';
import { getCellValue } from '../types/SpreadsheetCell';
import { isVisitMarked, VISIT_TOTAL_COLUMN } from '../utils/visit-markers';

export const ROUTE_WEEKDAY_COLUMNS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] as const;
const REQUIRED_HEADERS = ['INDUSTRIA', 'LOJA', 'UF', 'PROMOTORES', ...ROUTE_WEEKDAY_COLUMNS] as const;

export interface ExtractedPromoter {
  name: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface ExtractedStore {
  name: string;
  chain?: string;
  city?: string;
  state?: string;
}

export interface ExtractedIndustry {
  name: string;
  code?: string;
}

interface RouteSheetData {
  name: string;
  headerRowIndex: number;
  rows: SpreadsheetCell[][];
}

export interface RouteWorkbookData {
  kind: 'MK9_ROTEIRO_PROMOTORES';
  sheets: RouteSheetData[];
  auxiliary?: {
    promoters: ExtractedPromoter[];
    stores: ExtractedStore[];
    industries: ExtractedIndustry[];
  };
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

function parseAuxiliarySheets(workbook: XLSX.WorkBook) {
  const promoters: ExtractedPromoter[] = [];
  const stores: ExtractedStore[] = [];
  const industries: ExtractedIndustry[] = [];

  for (const name of workbook.SheetNames) {
    const upperName = name.trim().toUpperCase();

    if (upperName === 'PROMOTORES') {
      const rows = worksheetToRows(workbook.Sheets[name]);
      let headerIdx = -1;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (rows[i].some(c => normalizeHeader(c.value).includes('NOME'))) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx >= 0) {
        const headers = rows[headerIdx].map(c => normalizeHeader(c.value));
        const nameCol = headers.indexOf('NOME');
        const phoneCol = headers.findIndex(h => h.includes('CONTATO') || h.includes('TELEFONE'));
        const cityCol = headers.findIndex(h => h.includes('CIDADE') || h.includes('ATENDIMENTO'));

        for (let i = headerIdx + 1; i < rows.length; i++) {
          const r = rows[i];
          const nameVal = getCellValue(r[nameCol]);
          if (!nameVal) continue;

          const phoneVal = phoneCol >= 0 ? getCellValue(r[phoneCol]) : undefined;
          const cityVal = cityCol >= 0 ? getCellValue(r[cityCol]) : undefined;

          let city: string | undefined;
          let state: string | undefined;

          if (cityVal) {
            const cityStr = String(cityVal).trim();
            if (cityStr.includes('/')) {
              const parts = cityStr.split('/');
              city = parts[0].trim();
              state = parts[1]?.trim().toUpperCase().slice(0, 2);
            } else {
              city = cityStr;
            }
          }

          promoters.push({
            name: String(nameVal).trim(),
            phone: phoneVal ? String(phoneVal).trim() : undefined,
            city,
            state
          });
        }
      }
    } else if (upperName === 'LOJAS') {
      const rows = worksheetToRows(workbook.Sheets[name]);
      let headerIdx = -1;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (rows[i].some(c => normalizeHeader(c.value).includes('LOJA'))) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx >= 0) {
        const headers = rows[headerIdx].map(c => normalizeHeader(c.value));
        const lojaCol = headers.indexOf('LOJA');
        const redeCol = headers.findIndex(h => h.includes('REDE') || h.includes('BANDEIRA'));
        const ufCol = headers.indexOf('UF');
        const cityCol = headers.indexOf('CIDADE');

        for (let i = headerIdx + 1; i < rows.length; i++) {
          const r = rows[i];
          const nameVal = getCellValue(r[lojaCol]);
          if (!nameVal) continue;

          const redeVal = redeCol >= 0 ? getCellValue(r[redeCol]) : undefined;
          const ufVal = ufCol >= 0 ? getCellValue(r[ufCol]) : undefined;
          const cityVal = cityCol >= 0 ? getCellValue(r[cityCol]) : undefined;

          stores.push({
            name: String(nameVal).trim(),
            chain: redeVal ? String(redeVal).trim() : undefined,
            state: ufVal ? String(ufVal).trim().toUpperCase().slice(0, 2) : undefined,
            city: cityVal ? String(cityVal).trim() : undefined,
          });
        }
      }
    } else if (['INDUSTRIA', 'INDUSTRIAS', 'INDÚSTRIA', 'INDÚSTRIAS'].includes(upperName)) {
      const rows = worksheetToRows(workbook.Sheets[name]);
      let headerIdx = -1;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (rows[i].some(c => {
          const h = normalizeHeader(c.value);
          return h.includes('INDUSTRIA') || h.includes('NOME') || h.includes('CODIGO');
        })) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx >= 0) {
        const headers = rows[headerIdx].map(c => normalizeHeader(c.value));
        const nameCol = headers.findIndex(h => h.includes('NOME') || h.includes('INDUSTRIA'));
        const codeCol = headers.indexOf('CODIGO');

        for (let i = headerIdx + 1; i < rows.length; i++) {
          const r = rows[i];
          const nameVal = nameCol >= 0 ? getCellValue(r[nameCol]) : undefined;
          if (!nameVal) continue;

          const codeVal = codeCol >= 0 ? getCellValue(r[codeCol]) : undefined;

          industries.push({
            name: String(nameVal).trim(),
            code: codeVal ? String(codeVal).trim() : undefined,
          });
        }
      }
    }
  }

  return { promoters, stores, industries };
}

export function parseRouteWorkbook(buffer: Buffer): RouteWorkbookData | null {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets = workbook.SheetNames.flatMap((name) => {
    if (!name.trim().toUpperCase().startsWith('ROTEIRO')) return [];
    const rows = worksheetToRows(workbook.Sheets[name]);
    const headerRowIndex = findHeaderRow(rows);
    return headerRowIndex >= 0 ? [{ name, headerRowIndex, rows }] : [];
  });
  if (sheets.length === 0) return null;
  const auxiliary = parseAuxiliarySheets(workbook);
  return { kind: 'MK9_ROTEIRO_PROMOTORES', sheets, auxiliary };
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
