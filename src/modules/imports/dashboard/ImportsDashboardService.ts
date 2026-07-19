import { ImportsDashboardRepository } from './ImportsDashboardRepository';
import type { ImportItem, ImportsStatsData, ImportStatus } from './imports-dashboard.types';

function getImportStatus(record: {
  status: string;
  previewArtifacts: Array<{ expiresAt: Date; consumedAt: Date | null }>;
  confirmations: any[];
}): ImportStatus {
  if (record.status === 'FAILED') return 'FAILED';
  if (record.status === 'SUCCESS') return 'SUCCESS';
  if (record.confirmations.length > 0) return 'CONFIRMED';

  const artifact = record.previewArtifacts[0];
  if (artifact) {
    if (artifact.consumedAt) return 'CONFIRMED';
    const isExpired = new Date(artifact.expiresAt).getTime() <= Date.now();
    if (isExpired) return 'EXPIRED';
    return 'PENDING';
  }

  if (record.status === 'PROCESSING') return 'PENDING';
  return 'PENDING';
}

export class ImportsDashboardService {
  static async getDashboardData(): Promise<{
    imports: ImportItem[];
    stats: ImportsStatsData;
  }> {
    const rawImports = await ImportsDashboardRepository.getImportsList();

    const imports: ImportItem[] = rawImports.map((item) => {
      const file = item.files[0];
      const artifact = item.previewArtifacts[0];
      const confirmation = item.confirmations[0];
      const payload = artifact?.payload as any;

      const totalRows =
        payload?.audit?.totalRows ?? (artifact ? artifact.acceptedRows + artifact.rejectedRows : 0);
      const validRows = payload?.audit?.validRows ?? (artifact?.acceptedRows ?? 0);
      const invalidRows = payload?.audit?.invalidRows ?? (artifact?.rejectedRows ?? 0);
      const duplicateRows = payload?.audit?.duplicateRows ?? 0;

      const status = getImportStatus(item);

      return {
        id: item.id,
        nomeArquivo: file?.fileName || 'N/A',
        createdAt: item.createdAt.toLocaleString('pt-BR'),
        status,
        totalRows,
        validRows,
        invalidRows,
        duplicateRows,
        confirmedAt: confirmation?.confirmedAt
          ? confirmation.confirmedAt.toLocaleString('pt-BR')
          : artifact?.consumedAt
          ? artifact.consumedAt.toLocaleString('pt-BR')
          : null,
      };
    });

    const totalImports = imports.length;
    const confirmedCount = imports.filter((i) => i.status === 'CONFIRMED' || i.status === 'SUCCESS').length;
    const pendingCount = imports.filter((i) => i.status === 'PENDING').length;
    const failedCount = imports.filter((i) => i.status === 'FAILED').length;

    return {
      imports,
      stats: {
        totalImports,
        confirmedCount,
        pendingCount,
        failedCount,
      },
    };
  }
}
