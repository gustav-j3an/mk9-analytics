import { prisma } from '@/lib/prisma';

export interface RouteFilters {
  promoterId?: string;
  operationId?: string;
  industryId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class RoutesDashboardRepository {
  static getVisits(filters: RouteFilters) {
    return prisma.visit.findMany({
      where: {
        promoterId: filters.promoterId || undefined,
        operationId: filters.operationId || undefined,
        industryId: filters.industryId || undefined,
        scheduledDate: filters.startDate && filters.endDate ? { gte: filters.startDate, lte: filters.endDate } : undefined,
      },
      orderBy: [{ scheduledDate: 'asc' }, { promoter: { name: 'asc' } }, { store: { name: 'asc' } }],
      include: { promoter: true, store: true, industry: true, operation: true },
    });
  }

  static async getFilterOptions() {
    const [promoters, operations, industries, stores] = await Promise.all([
      prisma.promoter.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, operationId: true } }),
      prisma.operation.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, name: true, status: true, startsAt: true, endsAt: true } }),
      prisma.industry.findMany({ where: { archivedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.store.findMany({ where: { archivedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, chain: true, city: true, state: true, address: true } }),
    ]);
    return { promoters, operations, industries, stores };
  }
}
