import { prisma } from '@/lib/prisma';
import { validateStoreData, validateStoreUpdateData } from '../validators/store.validator';

const normalizeStoreInput = (data: Record<string, any>) => {
  const next = { ...data };
  // Convert empty strings to null for optional string fields
  if (next.chain === '') next.chain = null;
  if (next.address === '') next.address = null;
  if (next.city === '') next.city = null;
  if (next.state === '') next.state = null;
  return next;
};

export const storeService = {
  async getStores(options: { page?: number; limit?: number; search?: string; city?: string; state?: string; operationId?: string; archived?: 'active' | 'archived' | 'all' } = {}) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Record<string, any> = options.archived === 'all' ? {} : { archivedAt: options.archived === 'archived' ? { not: null } : null };

    if (options.search) {
      where.name = { contains: options.search, mode: 'insensitive' };
    }

    if (options.city) {
      where.city = options.city;
    }

    if (options.state) {
      where.state = options.state;
    }

    if (options.operationId) where.visits = { some: { operationId: options.operationId } };

    const [items, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          visits: { select: { operation: { select: { id: true, name: true } } }, distinct: ['operationId'] },
          _count: { select: { visits: true } },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getStoreById(id: string) {
    const store = await prisma.store.findUnique({ where: { id }, include: { visits: { orderBy: { scheduledDate: 'desc' }, include: { operation: true, industry: true, promoter: true } } } });

    if (!store) {
      const error = new Error('Store not found');
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    return store;
  },

  async getFilterOptions() {
    const [states, cities, operations] = await Promise.all([
      prisma.store.findMany({ where: { state: { not: null } }, distinct: ['state'], select: { state: true }, orderBy: { state: 'asc' } }),
      prisma.store.findMany({ where: { city: { not: null } }, distinct: ['city'], select: { city: true }, orderBy: { city: 'asc' } }),
      prisma.operation.findMany({ where: { visits: { some: {} } }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);
    return { states: states.flatMap((item) => item.state ? [item.state] : []), cities: cities.flatMap((item) => item.city ? [item.city] : []), operations };
  },

  async createStore(data: Record<string, any>) {
    const validated = validateStoreData(normalizeStoreInput(data));
    return prisma.store.create({ data: validated });
  },

  async updateStore(id: string, data: Record<string, any>) {
    const existing = await prisma.store.findUnique({ where: { id } });

    if (!existing) {
      const error = new Error('Store not found');
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    const validated = validateStoreUpdateData(normalizeStoreInput(data)) as Record<string, any>;
    return prisma.store.update({ where: { id }, data: validated });
  },

  async setArchived(id: string, archived: boolean) {
    const existing = await prisma.store.findUnique({ where: { id } });

    if (!existing) {
      const error = new Error('Store not found');
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    return prisma.store.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
  },
};

export default storeService;
