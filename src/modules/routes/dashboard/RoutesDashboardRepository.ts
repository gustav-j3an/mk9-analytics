import { prisma } from '@/lib/prisma';

export interface RouteFilters {
  promoterId?: string;
  operationId?: string;
  industryId?: string;
  startDate?: Date;
  endDate?: Date;
  storeId?: string;
  city?: string;
  state?: string;
}

export class RoutesDashboardRepository {
  static getVisits(filters: RouteFilters) {
    const where: any = {
      promoterId: filters.promoterId || undefined,
      operationId: filters.operationId || undefined,
      industryId: filters.industryId || undefined,
    };

    if (filters.startDate && filters.endDate) {
      where.scheduledDate = { gte: filters.startDate, lte: filters.endDate };
    }

    if (filters.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters.city) {
      where.store = { ...where.store, city: filters.city };
    }

    if (filters.state) {
      where.store = { ...where.store, state: filters.state };
    }

    return prisma.visit.findMany({
      where,
      orderBy: [{ scheduledDate: 'asc' }, { promoter: { name: 'asc' } }, { store: { name: 'asc' } }],
      include: { promoter: true, store: true, industry: true, operation: true },
    });
  }

  static async getFilterOptions() {
    const [promoters, operations, industries, stores, supervisors] = await Promise.all([
      prisma.promoter.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, phone: true, city: true, state: true, operationId: true, _count: { select: { visits: true } } } }),
      prisma.operation.findMany({ where: { name: { not: 'MK9 - OPERAÇÃO PADRÃO' } }, orderBy: { startsAt: 'desc' }, select: { id: true, name: true, status: true, startsAt: true, endsAt: true } }),
      prisma.industry.findMany({ where: { archivedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.store.findMany({ where: { archivedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, chain: true, city: true, state: true, address: true } }),
      prisma.supervisor.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);
    return { promoters, operations, industries, stores, supervisors };
  }
}
