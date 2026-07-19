import { prisma } from '@/lib/prisma';

export class ImportsDashboardRepository {
  static async getImportsList() {
    return prisma.import.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        files: true,
        previewArtifacts: true,
        confirmations: true,
      },
    });
  }
}
