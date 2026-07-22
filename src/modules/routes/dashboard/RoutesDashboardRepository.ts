import { prisma } from '@/lib/prisma';

export interface RouteFilters {
  promoterId?: string;
  operationId?: string;
  industryId?: string;
}

export class RoutesDashboardRepository {
  static getVisits(filters: RouteFilters) {
    return prisma.visit.findMany({
      where: {
        promoterId: filters.promoterId || undefined,
        operationId: filters.operationId || undefined,
        industryId: filters.industryId || undefined,
      },
      orderBy: [{ scheduledDate: 'asc' }, { promoter: { name: 'asc' } }, { store: { name: 'asc' } }],
      include: { promoter: true, store: true, industry: true, operation: true },
    });
  }

  static async getFilterOptions() {
    const [promoters, operations, industries] = await Promise.all([
      prisma.promoter.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.operation.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, name: true } }),
      prisma.industry.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);
    return { promoters, operations, industries };
  }
}
