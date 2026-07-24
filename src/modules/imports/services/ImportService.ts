import { prisma } from '../../../lib/prisma';
import { ImportStrategy } from '../types/ImportStrategy';
import { ExcelStrategy } from '../strategies/ExcelStrategy';
import { CsvStrategy } from '../strategies/CsvStrategy';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { PREVIEW_ERRORS_COLUMN, PREVIEW_SOURCE_ROW_COLUMN, PREVIEW_STATUS_COLUMN, SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type { ImportPreview, ImportValidationError, NormalizedImportRow } from '../types/ImportPreview';
import { buildPreviewArtifact, createPreviewDescriptor } from './ImportPreviewArtifactService';
import { countDetectedVisits } from '../utils/visit-markers';
import { KING_WARNING_COLUMN } from '../strategies/KingChecklistLayout';

export type PreviewResult = ImportPreview;

export class UnsupportedImportFileError extends Error {}
export class InvalidImportFileError extends Error {}

export function createVisualPreviewSample(normalizedData: NormalizedImportRow[], errors: ImportValidationError[] = []): NormalizedImportRow[] {
  const errorsByRow = new Map<number, string[]>();
  for (const error of errors) {
    const messages = errorsByRow.get(error.row) ?? [];
    messages.push(error.message);
    errorsByRow.set(error.row, messages);
  }
  return normalizedData.map((row, index) => {
    const sourceRow = row[SOURCE_ROW_NUMBER] ?? index + 1;
    const rowErrors = errorsByRow.get(sourceRow) ?? [];
    return {
      [PREVIEW_SOURCE_ROW_COLUMN]: sourceRow,
      [PREVIEW_STATUS_COLUMN]: rowErrors.length > 0 ? 'Inválida' : 'Válida',
      [PREVIEW_ERRORS_COLUMN]: rowErrors.join(' '),
      ...row,
    };
  });
}

// Define the import result type
export interface ImportResult {
  success: boolean;
  importId: string;
  message: string;
  rowsImported: number;
}

interface PersistablePreviewResult extends PreviewResult {
  uniqueData: NormalizedImportRow[];
}

export class ImportService {
  /**
   * Process a file to generate a preview without persisting data.
   * This method reads the file, parses it, validates it, detects duplicates,
   * and prepares a preview for the user.
   * 
   * @param file - The file to process
   * @returns A promise that resolves to the preview result
   */
  async processFileForPreview(file: File): Promise<PreviewResult> {
    // Create an import record in the database to track this import attempt
    const importRecord = await prisma.import.create({
      data: {
        status: 'PROCESSING',
      },
    });

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Determine the strategy based on file extension
      const strategy = this.getStrategyForFile(file.name);

      await strategy.detectOrigin();

      // Parse the file to get raw data
      let rawData: unknown[];
      try {
        rawData = await strategy.parse(arrayBuffer);
      } catch {
        throw new InvalidImportFileError('Não foi possível ler o arquivo. Verifique se ele não está corrompido.');
      }

      if (rawData.length === 0) {
        throw new InvalidImportFileError('O arquivo não contém linhas para visualizar.');
      }

      const detectedType = await strategy.detectType(rawData);

      // Normalize the raw data
      const normalizedData = await strategy.normalize(rawData);
      const totalVisitsDetected = countDetectedVisits(normalizedData);

      if (normalizedData.length === 0) {
        throw new InvalidImportFileError('O arquivo contém cabeçalhos, mas nenhuma linha de dados.');
      }

      // Validate the normalized data
      const { valid, errors } = await strategy.validate(normalizedData);
      const invalidRows = new Set(errors.map((error) => error.row)).size;

      // Detect duplicates in the valid data
      const { unique, duplicates } = await strategy.detectDuplicates(valid);

      // Generate preview data
      const preview = await strategy.generatePreview(unique, duplicates, invalidRows);
      const sample = createVisualPreviewSample(normalizedData, errors);
      const dataColumns = normalizedData[0] ? Object.keys(normalizedData[0]) : [];
      const columns = [PREVIEW_SOURCE_ROW_COLUMN, PREVIEW_STATUS_COLUMN, PREVIEW_ERRORS_COLUMN, ...dataColumns];
      const dateColumnCount = detectedType === SpreadsheetType.ROTEIRO_PROMOTORES
        ? dataColumns.filter((column) => ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].includes(column)).length
        : dataColumns.filter((column) => /^\d{2}_\d{2}_\d{4}$/.test(column)).length;
      const rowsWithVisits = normalizedData.filter((row) => Number(row.TOTAL_VISITAS_DETECTADAS) > 0).length;
      const sheets = strategy.getSheetNames ? await strategy.getSheetNames(arrayBuffer) : [];
      const auxiliary = strategy.getAuxiliaryData ? await strategy.getAuxiliaryData(arrayBuffer) : undefined;
      const warnings: string[] = [];
      const kingDivergences = normalizedData.filter((row) => Boolean(row[KING_WARNING_COLUMN])).length;

      if (detectedType === SpreadsheetType.DESCONHECIDO) {
        warnings.push('O tipo da planilha não foi reconhecido pelos cabeçalhos encontrados.');
      }
      if (duplicates.length > 0) {
        warnings.push(`${duplicates.length} linha(s) duplicada(s) foram removidas da amostra.`);
      }
      if (invalidRows > 0) {
        warnings.push(`${invalidRows} linha(s) inválida(s) não foram incluídas na amostra.`);
      }
      if (kingDivergences > 0) {
        warnings.push(`${kingDivergences} linha(s) possuem divergência entre REALIZADO e visitas detectadas.`);
      }

      if (unique.length === 0) {
        throw new InvalidImportFileError('O arquivo não possui linhas válidas para confirmação.');
      }

      const fileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      };
      const artifact = buildPreviewArtifact({
        importId: importRecord.id,
        file: fileMetadata,
        fileBytes: arrayBuffer,
        detectedType,
        sheets,
        columns,
        confirmableRows: unique,
        totalRows: normalizedData.length,
        validRows: valid.length,
        invalidRows,
        duplicateRows: duplicates.length,
        totalVisitsDetected,
        dateColumnCount,
        rowsWithVisits,
        errors,
        warnings,
        auxiliary,
      });
      const descriptor = createPreviewDescriptor(artifact);

      await prisma.$transaction(async (transaction) => {
        await transaction.importPreviewArtifact.create({ data: artifact.data });
        await transaction.import.update({
          where: { id: importRecord.id },
          data: { status: 'PROCESSING' },
        });
      });

      // Return the preview result
      return {
        success: true,
        importId: importRecord.id,
        previewToken: descriptor.previewToken,
        expiresAt: descriptor.expiresAt,
        file: fileMetadata,
        sheets,
        detectedType,
        columns,
        totalRows: normalizedData.length,
        validRows: valid.length,
        invalidRows,
        duplicateRows: duplicates.length,
        totalVisitsDetected,
        dateColumnCount,
        rowsWithVisits,
        sample,
        previewData: sample,
        errors,
        warnings,
      };
    } catch (error) {
      // Update the import record to failed state
      await prisma.import.update({
        where: { id: importRecord.id },
        data: {
          status: 'FAILED',
        },
      });
      throw error;
    }
  }

  /**
   * Import the data based on a previously generated preview.
   * This method persists the validated and deduplicated data to the database.
   * 
   * @param file - The original file (needed for logging history)
   * @param previewResult - The result from processFileForPreview
   * @returns A promise that resolves to the import result
   */
  async importFile(file: File, previewResult: PersistablePreviewResult): Promise<ImportResult> {
    try {
      // Get the strategy based on file extension
      const strategy = this.getStrategyForFile(file.name);

      // Persist the unique data
      await strategy.persist(previewResult.uniqueData);

      // Update the import record to successful
      await prisma.import.update({
        where: { id: previewResult.importId },
        data: {
          status: 'SUCCESS',
        },
      });

      // Log the history (this creates ImportFile and SyncLog records)
      await strategy.logHistory(
        previewResult.importId,
        file.name,
        file.size,
        {
          totalRows: previewResult.totalRows,
          validRows: previewResult.validRows,
          invalidRows: previewResult.invalidRows,
          duplicateRows: previewResult.duplicateRows,
          previewData: previewResult.previewData,
        }
      );

      return {
        success: true,
        importId: previewResult.importId,
        message: 'Import completed successfully',
        rowsImported: previewResult.validRows - previewResult.duplicateRows,
      };
    } catch (error) {
      // Update the import record to failed state
      await prisma.import.update({
        where: { id: previewResult.importId },
        data: {
          status: 'FAILED',
        },
      });
      throw error;
    }
  }

  /**
   * Reads a file and returns its contents as an ArrayBuffer.
   * 
   * @param file - The file to read
   * @returns A promise that resolves to the file's contents as an ArrayBuffer
   */
  /**
   * Selects the appropriate import strategy based on the file extension.
   * 
   * @param fileName - The name of the file
   * @returns An instance of the appropriate ImportStrategy
   * @throws Error if the file type is not supported
   */
  private getStrategyForFile(fileName: string): ImportStrategy {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'xlsx':
      case 'xls':
        return new ExcelStrategy();
      case 'csv':
        return new CsvStrategy();
      default:
        throw new UnsupportedImportFileError('Tipo de arquivo não suportado. Envie um arquivo CSV, XLS ou XLSX.');
    }
  }
}
