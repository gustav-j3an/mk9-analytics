import { prisma } from '../../../lib/prisma';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { ImportStrategy } from '../types/ImportStrategy';
import { ExcelReaderService } from '../services/ExcelReaderService';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type { ImportValidationError, NormalizedImportRow } from '../types/ImportPreview';
import type { StrategyPreview } from '../types/ImportStrategy';
import { validatePreviewRows } from '../services/validate-preview-rows';
import { getCellFormula, getCellValue, getFormattedCellValue, isSpreadsheetCell } from '../types/SpreadsheetCell';
import { isDateColumnHeader, isVisitMarked, VISIT_TOTAL_COLUMN } from '../utils/visit-markers';
import { isKingChecklistLayout, normalizeKingChecklist } from './KingChecklistLayout';
import { detectedRouteSheetNames, isRouteWorkbookData, normalizeRouteWorkbook, parseRouteWorkbook } from './RoteiroPromotoresLayout';

export class ExcelStrategy implements ImportStrategy {
  private isFilled(value: unknown): boolean {
    const rawValue = getCellValue(value);
    return rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '';
  }

  private findHeaderRowIndex(data: unknown[]): number {
    const rowsToInspect = data.slice(0, 25);
    let headerRowIndex = 0;
    let highestFilledCellCount = 0;

    rowsToInspect.forEach((row, index) => {
      if (!Array.isArray(row)) return;

      const filledCellCount = row.filter((value) => this.isFilled(value)).length;
      if (filledCellCount > highestFilledCellCount) {
        headerRowIndex = index;
        highestFilledCellCount = filledCellCount;
      }
    });

    return headerRowIndex;
  }

  private normalizeHeaders(headerRow: unknown[]): string[] {
    const occurrences = new Map<string, number>();

    return headerRow.map((header, index) => {
      const headerValue = getFormattedCellValue(header) ?? getCellValue(header);
      const normalized = String(headerValue ?? '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || `COLUNA_${index + 1}`;
      const occurrence = (occurrences.get(normalized) ?? 0) + 1;
      occurrences.set(normalized, occurrence);

      return occurrence === 1 ? normalized : `${normalized}_${occurrence}`;
    });
  }

  async detectOrigin(): Promise<string> {
    return 'local-file';
  }

  async detectType(data: unknown[]): Promise<SpreadsheetType> {
    if (!data || data.length === 0) {
      return SpreadsheetType.DESCONHECIDO;
    }

    if (isRouteWorkbookData(data)) return SpreadsheetType.ROTEIRO_PROMOTORES;
    if (isKingChecklistLayout(data)) return SpreadsheetType.KING_CHECKLIST;
    const headerRowIndex = this.findHeaderRowIndex(data);
    const headerRow = Array.isArray(data[headerRowIndex]) ? data[headerRowIndex] : [];
    const headers = this.normalizeHeaders(headerRow);
    const headerString = headers.join(' ').toUpperCase();

    const typeKeywords: Record<SpreadsheetType, string[]> = {
      [SpreadsheetType.KING_CHECKLIST]: ['BANDEIRA', 'LOJA', 'UF', 'VISITA_SEMANAL', 'VISITA_MENSAL', 'REALIZADO'],
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
    const buffer = Buffer.from(data);
    const routeWorkbook = parseRouteWorkbook(buffer);
    return routeWorkbook ? [routeWorkbook] : await ExcelReaderService.readFileFromBuffer(buffer);
  }

  async getSheetNames(data: ArrayBuffer): Promise<string[]> {
    const buffer = Buffer.from(data);
    const routeWorkbook = parseRouteWorkbook(buffer);
    return routeWorkbook ? detectedRouteSheetNames([routeWorkbook]) : ExcelReaderService.getSheetNamesFromBuffer(buffer);
  }

  async normalize(rawData: unknown[]): Promise<NormalizedImportRow[]> {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    if (isRouteWorkbookData(rawData)) return normalizeRouteWorkbook(rawData[0]);
    if (isKingChecklistLayout(rawData)) return normalizeKingChecklist(rawData).rows;
    const headerRowIndex = this.findHeaderRowIndex(rawData);
    const headerRow = Array.isArray(rawData[headerRowIndex]) ? rawData[headerRowIndex] : [];
    const headers = this.normalizeHeaders(headerRow);
    const visitColumnIndexes = new Set<number>();
    headerRow.forEach((cell, index) => {
      if (isDateColumnHeader(getCellValue(cell), getFormattedCellValue(cell))) visitColumnIndexes.add(index);
    });
    const dataRows: Array<{ row: unknown[]; sourceRow: number }> = [];
    rawData.slice(headerRowIndex + 1).forEach((row, index) => {
      if (Array.isArray(row) && row.some((value) => this.isFilled(value))) {
        dataRows.push({ row, sourceRow: headerRowIndex + index + 2 });
      }
    });

    return dataRows.map(({ row, sourceRow }) => {
      const obj: NormalizedImportRow = {};
      let totalVisits = 0;
      headers.forEach((header, index) => {
        const cell = row[index];
        if (visitColumnIndexes.has(index)) {
          const rawValue = getCellValue(cell);
          const marked = isVisitMarked(rawValue)
            || ((rawValue === null || rawValue === undefined) && isVisitMarked(getFormattedCellValue(cell)));
          obj[header] = marked ? '✓' : '-';
          if (marked) totalVisits += 1;
          if (process.env.NODE_ENV === 'development' && (this.isFilled(cell) || getCellFormula(cell))) {
            console.debug('[imports:xlsx] visit cell', {
              row: sourceRow,
              column: header,
              v: rawValue,
              w: getFormattedCellValue(cell),
              t: isSpreadsheetCell(cell) ? cell.type : typeof rawValue,
              f: getCellFormula(cell),
              boolean: typeof rawValue === 'boolean' ? rawValue : undefined,
              unicode: typeof rawValue === 'string' ? Array.from(rawValue, (character) => `U+${character.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`) : undefined,
            });
          }
        } else {
          obj[header] = getCellValue(cell);
        }
      });
      if (visitColumnIndexes.size > 0) obj[VISIT_TOTAL_COLUMN] = totalVisits;
      obj[SOURCE_ROW_NUMBER] = sourceRow;
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
