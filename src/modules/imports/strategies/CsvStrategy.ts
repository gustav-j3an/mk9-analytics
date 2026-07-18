import { prisma } from '../../../lib/prisma';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { ImportStrategy } from '../types/ImportStrategy';
import { parseCsv } from '../parsers/csvParser';

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

  async normalize(rawData: unknown[]): Promise<any[]> {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1) as unknown[][];

    return dataRows.map((row) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  }

  async validate(normalizedData: any[]): Promise<{ valid: any[]; errors: any[] }> {
    const valid: any[] = [];
    const errors: any[] = [];

    for (const data of normalizedData) {
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        valid.push(data);
      } else {
        errors.push({ data, error: 'Invalid row' });
      }
    }

    return { valid, errors };
  }

  async detectDuplicates(validData: any[]): Promise<{ unique: any[]; duplicates: any[] }> {
    const seen = new Set<string>();
    const unique: any[] = [];
    const duplicates: any[] = [];

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

  async generatePreview(uniqueData: any[], duplicates: any[]): Promise<any> {
    return {
      totalRows: uniqueData.length + duplicates.length,
      validRows: uniqueData.length,
      invalidRows: 0,
      duplicateRows: duplicates.length,
      previewData: uniqueData.slice(0, 10),
    };
  }

  async persist(uniqueData: any[]): Promise<void> {
    console.log(`Would persist ${uniqueData.length} records to database`);
    // Actual implementation would use Prisma to create records based on spreadsheet type
  }

  async logHistory(importId: string, fileName: string, size: number, result: any): Promise<void> {
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