export type ImportStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'EXPIRED' | 'CONFIRMED';

export interface ImportItem {
  id: string;
  nomeArquivo: string;
  createdAt: string;
  status: ImportStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  confirmedAt: string | null;
}

export interface ImportsStatsData {
  totalImports: number;
  confirmedCount: number;
  pendingCount: number;
  failedCount: number;
}
