export const VISIT_TOTAL_COLUMN = 'TOTAL_VISITAS_DETECTADAS';

const INVISIBLE_SPACES = /[\u00A0\u200B-\u200D\u2060\uFEFF]/g;
const MARKED_VALUES = new Set(['TRUE', '1', 'X', 'SIM', 'S', 'OK', '✓', '✔', '☑', '✅']);
const UNMARKED_VALUES = new Set(['FALSE', '0', '', '-', 'NAO']);

function normalizeVisitValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value).replace(INVISIBLE_SPACES, '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

export function isVisitMarked(value: unknown, formattedValue?: unknown, formula?: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (value === null || value === undefined) {
    if (formattedValue === null || formattedValue === undefined || normalizeVisitValue(formattedValue) === '') {
      const normalizedFormula = normalizeVisitValue(formula)?.replace(/^=/, '');
      return normalizedFormula === 'TRUE' || normalizedFormula === 'TRUE()';
    }
  }
  for (const candidate of [value, formattedValue]) {
    const normalized = normalizeVisitValue(candidate);
    if (normalized === null || UNMARKED_VALUES.has(normalized)) continue;
    if (MARKED_VALUES.has(normalized)) return true;
  }
  const normalizedFormula = normalizeVisitValue(formula)?.replace(/^=/, '');
  return normalizedFormula === 'TRUE' || normalizedFormula === 'TRUE()';
}

export function isDateColumnHeader(value: unknown, formattedValue?: unknown): boolean {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;
  return [formattedValue, value].some((candidate) => {
    if (typeof candidate !== 'string') return false;
    return /^\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?$/.test(candidate.replace(INVISIBLE_SPACES, '').trim());
  });
}

export function countDetectedVisits(rows: Array<Record<string, unknown>>): number {
  return rows.reduce((total, row) => {
    const rowTotal = row[VISIT_TOTAL_COLUMN];
    return total + (typeof rowTotal === 'number' && Number.isFinite(rowTotal) ? rowTotal : 0);
  }, 0);
}
