import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type { ImportValidationError, NormalizedImportRow } from '../types/ImportPreview';

const REQUIRED_ROUTE_FIELDS = ['INDUSTRIA', 'LOJA', 'UF'] as const;
const FREQUENCY_FIELDS = ['VISITA_SEMANAL', 'VISITA_MENSAL'] as const;
const ROUTE_SIGNATURE_FIELDS = [...REQUIRED_ROUTE_FIELDS, ...FREQUENCY_FIELDS];

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function isRouteRow(row: NormalizedImportRow): boolean {
  return ROUTE_SIGNATURE_FIELDS.filter((field) => field in row).length >= 2;
}

function createError(row: number, field: string, message: string, data: NormalizedImportRow): ImportValidationError {
  return { row, field, message: `${field}: ${message}`, data };
}

export function validatePreviewRows(normalizedData: NormalizedImportRow[]): {
  valid: NormalizedImportRow[];
  errors: ImportValidationError[];
} {
  const valid: NormalizedImportRow[] = [];
  const errors: ImportValidationError[] = [];

  normalizedData.forEach((data, index) => {
    const row = data[SOURCE_ROW_NUMBER] ?? index + 1;
    const rowErrors: ImportValidationError[] = [];

    if (Object.keys(data).length === 0) {
      rowErrors.push(createError(row, 'linha', 'não contém dados válidos.', data));
    } else if (isRouteRow(data)) {
      REQUIRED_ROUTE_FIELDS.forEach((field) => {
        if (!hasValue(data[field])) {
          rowErrors.push(createError(row, field, 'campo obrigatório não preenchido.', data));
        }
      });

      if ('ABA' in data && !hasValue(data.PROMOTOR)) {
        rowErrors.push(createError(row, 'PROMOTOR', 'campo obrigatório não preenchido.', data));
      }

      const isKingChecklistRow = 'REALIZADO' in data && 'AVISOS' in data
        && FREQUENCY_FIELDS.every((field) => typeof data[field] === 'number');
      const requiresFrequency = FREQUENCY_FIELDS.some((field) => field in data) && !isKingChecklistRow;
      const hasFrequency = FREQUENCY_FIELDS.some((field) => hasValue(data[field]));
      if (requiresFrequency && !hasFrequency) {
        rowErrors.push(createError(
          row,
          'VISITA_SEMANAL|VISITA_MENSAL',
          'preencha ao menos uma frequência de atendimento.',
          data,
        ));
      }
    }

    if (rowErrors.length === 0) valid.push(data);
    else errors.push(...rowErrors);
  });

  return { valid, errors };
}
