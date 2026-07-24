import type { ImportValidationError, NormalizedImportRow } from './ImportPreview';
import type { SpreadsheetType } from './SpreadsheetType';

export interface StrategyPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  previewData: NormalizedImportRow[];
}

export interface ImportStrategy {
  /**
   * Detects the origin of the data (file, Google Drive, etc.)
   * For file-based strategies, this can be omitted or return a fixed value.
   */
  detectOrigin(): Promise<string>;

  /**
   * Detects the type of the spreadsheet based on the content.
   * Returns the SpreadsheetType enum.
   */
  detectType(data: unknown[]): Promise<SpreadsheetType>;

  /**
   * Parses the file and returns the raw data as an array of rows.
   * Each row is an array of cell values.
   */
  parse(data: ArrayBuffer): Promise<unknown[]>;

  /**
   * Normalizes the raw data into a normalized record format.
   * This step is optional and can be handled by a separate normalizer.
   * But for simplicity, we can include it in the strategy.
   */
  normalize(rawData: unknown[]): Promise<NormalizedImportRow[]>;

  /**
   * Validates the normalized data.
   * Returns an array of validation errors (if any) and the valid data.
   */
  validate(normalizedData: NormalizedImportRow[]): Promise<{ valid: NormalizedImportRow[]; errors: ImportValidationError[] }>;

  /**
   * Detects duplicates in the validated data.
   * Returns the data with duplicates marked or removed.
   */
  detectDuplicates(validData: NormalizedImportRow[]): Promise<{ unique: NormalizedImportRow[]; duplicates: NormalizedImportRow[] }>;

  /**
   * Generates preview data for the UI.
   */
  generatePreview(uniqueData: NormalizedImportRow[], duplicates: NormalizedImportRow[], invalidRows?: number): Promise<StrategyPreview>;

  getSheetNames?(data: ArrayBuffer): Promise<string[]>;

  getAuxiliaryData?(data: ArrayBuffer): Promise<any>;

  /**
   * Persists the data to the database.
   */
  persist(uniqueData: NormalizedImportRow[]): Promise<void>;

  /**
   * Logs the import history.
   */
  logHistory(importId: string, fileName: string, size: number, result: StrategyPreview): Promise<void>;
}
