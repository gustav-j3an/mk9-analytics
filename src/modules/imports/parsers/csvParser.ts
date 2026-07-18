import * as Papa from 'papaparse';

export async function parseCsv(arrayBuffer: ArrayBuffer): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const decoder = new TextDecoder('utf-8');
      const csvString = decoder.decode(arrayBuffer);
      Papa.parse(csvString, {
        header: false,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}