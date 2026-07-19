import { prisma } from '@/lib/prisma';

export class DashboardRepository {
  static async getOperationsCount(): Promise<number> {
    return prisma.operation.count();
  }

  static async getStoresCount(): Promise<number> {
    return prisma.store.count();
  }

  static async getIndustriesCount(): Promise<number> {
    return prisma.industry.count();
  }

  static async getPromotersCount(): Promise<number> {
    return prisma.promoter.count();
  }

  static async getVisitsCount(): Promise<number> {
    return prisma.visit.count();
  }

  static async getPendingVisitsCount(): Promise<number> {
    return prisma.visit.count({
      where: { status: 'PLANEJADA' },
    });
  }

  static async getFailedImportsCount(): Promise<number> {
    return prisma.import.count({
      where: { status: 'FAILED' },
    });
  }

  static async getLastImportDate(): Promise<Date | null> {
    const lastImport = await prisma.import.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return lastImport ? lastImport.createdAt : null;
  }
}
