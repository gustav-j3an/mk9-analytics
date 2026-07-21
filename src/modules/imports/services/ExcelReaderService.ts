import * as XLSX from 'xlsx';
import type { SpreadsheetCell } from '../types/SpreadsheetCell';

function worksheetToRows(worksheet: XLSX.WorkSheet): SpreadsheetCell[][] {
  if (!worksheet['!ref']) return [];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const rows: SpreadsheetCell[][] = [];
  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row: SpreadsheetCell[] = [];
    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })] as XLSX.CellObject | undefined;
      row[columnIndex - range.s.c] = { value: cell?.v, formattedValue: cell?.w, formula: cell?.f, type: cell?.t };
    }
    rows.push(row);
  }
  return rows;
}

export class ExcelReaderService {
  static getSheetNamesFromBuffer(buffer: Buffer): string[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook.SheetNames;
  }

  /**
   * Reads an Excel file from a Buffer (server-side)
   * @param buffer - The file content as a Buffer
   * @returns Promise resolving to the parsed data as an array of rows (each row is an array of cell values)
   */
  static async readFileFromBuffer(buffer: Buffer): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        resolve(worksheetToRows(worksheet));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Reads an Excel file from a File object (browser-side)
   * @param file - The file object
   * @returns Promise resolving to the parsed data as an array of rows
   */
  static async readFileFromFile(file: File): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          resolve(worksheetToRows(worksheet));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  }
}
