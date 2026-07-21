import * as XLSX from 'xlsx';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type { NormalizedImportRow } from '../types/ImportPreview';
import { getCellValue, getFormattedCellValue } from '../types/SpreadsheetCell';
import { isVisitMarked, VISIT_TOTAL_COLUMN } from '../utils/visit-markers';

export const KING_WARNING_COLUMN = 'AVISOS';
const KING_REQUIRED_HEADERS = ['BANDEIRA', 'LOJA', 'UF', 'VISITA_SEMANAL', 'VISITA_MENSAL', 'REALIZADO'] as const;

function text(value: unknown): string {
  return String(getFormattedCellValue(value) ?? getCellValue(value) ?? '').trim();
}

export function normalizeKingHeader(value: unknown): string {
  return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function findKingHeaderRowIndex(rows: unknown[]): number {
  const limit = Math.min(20, rows.length);
  for (let index = 0; index < limit; index += 1) {
    const row: unknown[] = Array.isArray(rows[index]) ? rows[index] as unknown[] : [];
    const headers = new Set(row.map(normalizeKingHeader));
    if (KING_REQUIRED_HEADERS.every((header) => headers.has(header)) && !headers.has('INDUSTRIA')) return index;
  }
  return -1;
}

export function isKingChecklistLayout(rows: unknown[]): boolean {
  return findKingHeaderRowIndex(rows) >= 0;
}

function pad(value: number): string { return String(value).padStart(2, '0'); }
function dateKey(year: number, month: number, day: number): string | null {
  if (!year || !month || !day) return null;
  return `${pad(day)}_${pad(month)}_${year}`;
}

export function normalizeKingDateHeader(cell: unknown): string | null {
  const raw = getCellValue(cell);
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return dateKey(raw.getUTCFullYear(), raw.getUTCMonth() + 1, raw.getUTCDate());
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const parsed = XLSX.SSF.parse_date_code(raw);
    return parsed ? dateKey(parsed.y, parsed.m, parsed.d) : null;
  }
  for (const candidate of [getFormattedCellValue(cell), raw]) {
    if (typeof candidate !== 'string') continue;
    const match = candidate.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) return dateKey(Number(match[3]), Number(match[2]), Number(match[1]));
  }
  return null;
}

function numeric(value: unknown): number {
  const raw = getCellValue(value);
  if (raw === null || raw === undefined || String(raw).trim() === '') return 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Number(String(raw).trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isEntirelyEmpty(row: unknown[]): boolean { return row.every((cell) => text(cell) === ''); }
function isIgnoredKingRow(row: unknown[]): boolean {
  const values = row.map((cell) => normalizeKingHeader(cell)).filter(Boolean);
  return values.some((value) => value.includes('TOTAL_VISITAS_MES_REALIZADO') || value === 'TOTAL' || value.startsWith('TOTAL_'));
}

export interface KingNormalizationResult {
  rows: NormalizedImportRow[];
  headerRowIndex: number;
  dateColumns: string[];
  divergenceCount: number;
}

export function normalizeKingChecklist(rows: unknown[]): KingNormalizationResult {
  const headerRowIndex = findKingHeaderRowIndex(rows);
  if (headerRowIndex < 0) return { rows: [], headerRowIndex, dateColumns: [], divergenceCount: 0 };
  const header = rows[headerRowIndex] as unknown[];
  const normalizedHeaders = header.map(normalizeKingHeader);
  const indexOf = (name: string) => normalizedHeaders.indexOf(name);
  const bandeiraIndex = indexOf('BANDEIRA');
  const lojaIndex = indexOf('LOJA');
  const ufIndex = indexOf('UF');
  const weeklyIndex = indexOf('VISITA_SEMANAL');
  const monthlyIndex = indexOf('VISITA_MENSAL');
  const realizedIndex = indexOf('REALIZADO');
  const dateIndexes = Array.from({ length: Math.max(0, realizedIndex - monthlyIndex - 1) }, (_, offset) => monthlyIndex + 1 + offset)
    .map((index) => ({ index, key: normalizeKingDateHeader(header[index]) }))
    .filter((entry): entry is { index: number; key: string } => Boolean(entry.key));
  const normalizedRows: NormalizedImportRow[] = [];
  let lastBandeira: unknown = null;
  let divergenceCount = 0;

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = Array.isArray(rows[rowIndex]) ? rows[rowIndex] as unknown[] : [];
    if (isEntirelyEmpty(row)) { lastBandeira = null; continue; }
    if (isIgnoredKingRow(row)) { lastBandeira = null; continue; }
    const loja = getCellValue(row[lojaIndex]);
    const uf = getCellValue(row[ufIndex]);
    const currentBandeira = getCellValue(row[bandeiraIndex]);
    if (currentBandeira !== null && currentBandeira !== undefined && String(currentBandeira).trim() !== '') lastBandeira = currentBandeira;
    const industria = currentBandeira === null || currentBandeira === undefined || String(currentBandeira).trim() === '' ? lastBandeira : currentBandeira;
    if ((loja === null || loja === undefined || String(loja).trim() === '') && (uf === null || uf === undefined || String(uf).trim() === '')) continue;

    const output: NormalizedImportRow = {
      INDUSTRIA: industria,
      LOJA: loja,
      UF: uf,
      VISITA_SEMANAL: numeric(row[weeklyIndex]),
      VISITA_MENSAL: numeric(row[monthlyIndex]),
    };
    let detected = 0;
    for (const { index, key } of dateIndexes) {
      const marked = isVisitMarked(getCellValue(row[index])) || isVisitMarked(getFormattedCellValue(row[index]));
      output[key] = marked ? '✓' : '-';
      if (marked) detected += 1;
    }
    const realized = numeric(row[realizedIndex]);
    output.REALIZADO = realized;
    output[VISIT_TOTAL_COLUMN] = detected;
    if (realized !== detected) {
      output[KING_WARNING_COLUMN] = `REALIZADO informado (${realized}) difere das visitas detectadas (${detected}).`;
      divergenceCount += 1;
    } else output[KING_WARNING_COLUMN] = '';
    output[SOURCE_ROW_NUMBER] = rowIndex + 1;
    normalizedRows.push(output);
  }
  return { rows: normalizedRows, headerRowIndex, dateColumns: dateIndexes.map((entry) => entry.key), divergenceCount };
}
