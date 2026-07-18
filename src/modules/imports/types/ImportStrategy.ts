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
  detectType(data: unknown[]): Promise<import('./SpreadsheetType').SpreadsheetType>;

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
  normalize(rawData: unknown[]): Promise<any[]>;

  /**
   * Validates the normalized data.
   * Returns an array of validation errors (if any) and the valid data.
   */
  validate(normalizedData: any[]): Promise<{ valid: any[]; errors: any[] }>;

  /**
   * Detects duplicates in the validated data.
   * Returns the data with duplicates marked or removed.
   */
  detectDuplicates(validData: any[]): Promise<{ unique: any[]; duplicates: any[] }>;

  /**
   * Generates preview data for the UI.
   */
  generatePreview(uniqueData: any[], duplicates: any[]): any;

  /**
   * Persists the data to the database.
   */
  persist(uniqueData: any[]): Promise<void>;

  /**
   * Logs the import history.
   */
  logHistory(importId: string, fileName: string, size: number, result: any): Promise<void>;
}