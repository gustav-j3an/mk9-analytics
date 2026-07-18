import { prisma } from '../../../lib/prisma';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { ImportStrategy } from '../types/ImportStrategy';
import { ExcelReaderService } from './ExcelReaderService';
import { parseCsv } from '../parsers/csvParser';

// Define the preview result type
export interface PreviewResult {
  importId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  previewData: any[];
  uniqueData: any[];
  duplicates: any[];
}

// Define the import result type
export interface ImportResult {
  success: boolean;
  importId: string;
  message: string;
  rowsImported: number;
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
      // Read the file as ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);

      // Determine the strategy based on file extension
      const strategy = this.getStrategyForFile(file.name);

      // Detect origin (for file upload, it's always 'local-file')
      const origin = await strategy.detectOrigin();

      // Parse the file to get raw data
      const rawData = await strategy.parse(arrayBuffer);

      // Normalize the raw data
      const normalizedData = await strategy.normalize(rawData);

      // Validate the normalized data
      const { valid, errors } = await strategy.validate(normalizedData);

      // Detect duplicates in the valid data
      const { unique, duplicates } = await strategy.detectDuplicates(valid);

      // Generate preview data
      const preview = await strategy.generatePreview(unique, duplicates);

      // Update the import record with progress (still processing)
      await prisma.import.update({
        where: { id: importRecord.id },
        data: {
          status: 'PROCESSING',
        },
      });

      // Return the preview result
      return {
        importId: importRecord.id,
        totalRows: preview.totalRows || 0,
        validRows: preview.validRows || 0,
        invalidRows: preview.invalidRows || 0,
        duplicateRows: preview.duplicateRows || 0,
        previewData: preview.previewData || [],
        uniqueData: unique,
        duplicates: duplicates,
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
  async importFile(file: File, previewResult: PreviewResult): Promise<ImportResult> {
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
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsArrayBuffer(file);
    });
  }

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
        return new (require('./strategies/ExcelStrategy').ExcelStrategy)();
      case 'csv':
        return new (require('./strategies/CsvStrategy').CsvStrategy)();
      default:
        throw new Error(`Unsupported file type: ${extension}. Supported types are: xlsx, xls, csv`);
    }
  }
}