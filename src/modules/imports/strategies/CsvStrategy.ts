import { prisma } from '../../../lib/prisma';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { ImportStrategy } from '../types/ImportStrategy';
import { parseCsv } from '../parsers/csvParser';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type { ImportValidationError, NormalizedImportRow } from '../types/ImportPreview';
import type { StrategyPreview } from '../types/ImportStrategy';
import { validatePreviewRows } from '../services/validate-preview-rows';
import { isDateColumnHeader, isVisitMarked, VISIT_TOTAL_COLUMN } from '../utils/visit-markers';

export class CsvStrategy implements ImportStrategy {
  async detectOrigin(): Promise<string> {
    return 'local-file';
  }

  async detectType(data: unknown[]): Promise<SpreadsheetType> {
    if (!data || data.length === 0) {
      return SpreadsheetType.DESCONHECIDO;
    }

    const headers = data[0] as string[];
    const headerString = headers.join(' ').toUpperCase();

    const typeKeywords: Record<SpreadsheetType, string[]> = {
      [SpreadsheetType.PROMOTORES]: ['NOME', 'CIDADE', 'ESTADO', 'SUPERVISOR'],
      [SpreadsheetType.LOJAS]: ['NOME', 'CODIGO', 'CIDADE', 'ESTADO', 'REDE'],
      [SpreadsheetType.INDUSTRIAS]: ['CODIGO', 'NOME'],
      [SpreadsheetType.ROTEIRO_PROMOTORES]: ['PROMOTOR', 'LOJA', 'DATA', 'HORA'],
      [SpreadsheetType.FREQUENCIA_LOJAS]: ['LOJA', 'DATA', 'FREQUENCIA'],
      [SpreadsheetType.CHECKLIST_INDUSTRIA]: ['INDUSTRIA', 'ITEM', 'STATUS'],
      [SpreadsheetType.DESCONHECIDO]: []
    };

    for (const [typeStr, keywords] of Object.entries(typeKeywords)) {
      const typeEnum = typeStr as SpreadsheetType;
      const match = keywords.every((keyword) => headerString.includes(keyword));
      if (match) {
        return typeEnum;
      }
    }

    return SpreadsheetType.DESCONHECIDO;
  }

  async parse(data: ArrayBuffer): Promise<unknown[]> {
    return await parseCsv(data);
  }

  async normalize(rawData: unknown[]): Promise<NormalizedImportRow[]> {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    const headers = (rawData[0] as unknown[]).map((header) => String(header ?? ''));
    const visitColumnIndexes = new Set<number>();
    headers.forEach((header, index) => {
      if (isDateColumnHeader(header)) visitColumnIndexes.add(index);
    });
    const dataRows = rawData.slice(1) as unknown[][];

    return dataRows.map((row, rowIndex) => {
      const obj: NormalizedImportRow = {};
      let totalVisits = 0;
      headers.forEach((header, index) => {
        if (visitColumnIndexes.has(index)) {
          const marked = isVisitMarked(row[index]);
          obj[header] = marked ? '✓' : '-';
          if (marked) totalVisits += 1;
        } else {
          obj[header] = row[index];
        }
      });
      if (visitColumnIndexes.size > 0) obj[VISIT_TOTAL_COLUMN] = totalVisits;
      obj[SOURCE_ROW_NUMBER] = rowIndex + 2;
      return obj;
    });
  }

  async validate(normalizedData: NormalizedImportRow[]): Promise<{ valid: NormalizedImportRow[]; errors: ImportValidationError[] }> {
    return validatePreviewRows(normalizedData);
  }

  async detectDuplicates(validData: NormalizedImportRow[]): Promise<{ unique: NormalizedImportRow[]; duplicates: NormalizedImportRow[] }> {
    const seen = new Set<string>();
    const unique: NormalizedImportRow[] = [];
    const duplicates: NormalizedImportRow[] = [];

    for (const data of validData) {
      const key = JSON.stringify(data);
      if (seen.has(key)) {
        duplicates.push(data);
      } else {
        seen.add(key);
        unique.push(data);
      }
    }

    return { unique, duplicates };
  }

  async generatePreview(uniqueData: NormalizedImportRow[], duplicates: NormalizedImportRow[], invalidRows = 0): Promise<StrategyPreview> {
    return {
      totalRows: uniqueData.length + duplicates.length,
      validRows: uniqueData.length,
      invalidRows,
      duplicateRows: duplicates.length,
      previewData: uniqueData,
    };
  }

  async persist(uniqueData: NormalizedImportRow[]): Promise<void> {
    console.log(`Would persist ${uniqueData.length} records to database`);
    // Actual implementation would use Prisma to create records based on spreadsheet type
  }

  async logHistory(importId: string, fileName: string, size: number, result: StrategyPreview): Promise<void> {
    await prisma.importFile.create({
      data: {
        fileName,
        fileHash: `${fileName}-${size}-${Date.now()}`,
        rowCount: result.totalRows,
        importId,
      },
    });

    await prisma.syncLog.create({
      data: {
        action: 'IMPORT_FILE',
        status: 'INFO',
        message: `Imported file ${fileName} with ${result.validRows} valid rows, ${result.invalidRows} invalid, ${result.duplicateRows} duplicates`,
        details: JSON.stringify({
          importFileId: 'placeholder',
          importId,
          fileName,
          validRows: result.validRows,
          invalidRows: result.invalidRows,
          duplicateRows: result.duplicateRows,
        }),
      },
    });
  }
}
