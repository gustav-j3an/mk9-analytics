// src/modules/imports/types/ImportPreview.ts
import { SpreadsheetType } from './SpreadsheetType';

export const SOURCE_ROW_NUMBER: unique symbol = Symbol('import.sourceRowNumber');

export type NormalizedImportRow = Record<string, unknown> & {
  [SOURCE_ROW_NUMBER]?: number;
};

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
  data?: NormalizedImportRow;
}

export interface ImportFileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface ImportPreview {
  success: true;
  importId: string;
  previewToken: string;
  expiresAt: string;
  file: ImportFileMetadata;
  sheets: string[];
  detectedType: SpreadsheetType;
  columns: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  totalVisitsDetected: number;
  sample: NormalizedImportRow[];
  /** Kept for compatibility with the existing interface. */
  previewData: NormalizedImportRow[];
  errors: ImportValidationError[];
  warnings: string[];
}
