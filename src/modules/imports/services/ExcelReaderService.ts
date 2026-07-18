import * as XLSX from 'xlsx';

export class ExcelReaderService {
  /**
   * Reads an Excel file from a Buffer (server-side)
   * @param buffer - The file content as a Buffer
   * @returns Promise resolving to the parsed data as an array of rows (each row is an array of cell values)
   */
  static async readFileFromBuffer(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(json);
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
  static async readFileFromFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(json);
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