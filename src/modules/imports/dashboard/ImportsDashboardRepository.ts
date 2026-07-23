import { prisma } from '@/lib/prisma';

export function buildImportOperationFilter(operationId?: string) {
  return operationId ? { operationId } : undefined;
}

export class ImportsDashboardRepository {
  static async getImportsList(operationId?: string) {
    return prisma.import.findMany({
      where: buildImportOperationFilter(operationId),
      orderBy: { createdAt: 'desc' },
      include: {
        files: true,
        previewArtifacts: true,
        confirmations: true,
        visitEvidences: { select: { visitId: true } },
        operation: { select: { id: true, name: true } },
      },
    });
  }
}
