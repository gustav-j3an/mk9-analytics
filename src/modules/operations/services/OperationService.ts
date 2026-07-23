import { OperationStatus, VisitStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { operationPlanner } from '../utils/OperationPlanner';
import {
  validateOperationData,
  validateOperationUpdateData,
  validateDateRange,
  validateDatesInMonthYear,
  validateMonthYearDates,
} from '../validators/operation.validator';

const normalizeOperationInput = (data: Record<string, any>) => {
  const next = { ...data };

  if (typeof next.startsAt === 'string') {
    next.startsAt = new Date(next.startsAt);
  }

  if (typeof next.endsAt === 'string') {
    next.endsAt = new Date(next.endsAt);
  }

  return next;
};

export const operationService = {
  async getOperations(options: { page?: number; limit?: number; status?: string; search?: string } = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (options.status) {
      where.status = options.status as OperationStatus;
    }

    if (options.search) {
      where.name = { contains: options.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.operation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.operation.count({ where }),
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

  async getOperationById(id: string) {
    const operation = await prisma.operation.findUnique({ where: { id } });

    if (!operation) {
      const error = new Error('Operation not found');
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    return operation;
  },

  async getManagementDetail(id: string) {
    const operation = await prisma.operation.findUnique({
      where: { id },
      include: {
        imports: {
          orderBy: { createdAt: 'desc' },
          include: { files: true, confirmations: true },
        },
        visits: {
          orderBy: { scheduledDate: 'asc' },
          include: {
            store: true,
            industry: true,
            promoter: { include: { supervisor: true } },
          },
        },
        promoters: { include: { supervisor: true }, orderBy: { name: 'asc' } },
        evidences: {
          orderBy: { createdAt: 'desc' },
          include: { audits: { orderBy: { createdAt: 'desc' } }, store: true, industry: true, visit: true },
        },
      },
    });
    if (!operation) {
      const error = new Error('Operation not found');
      (error as Error & { status?: number }).status = 404;
      throw error;
    }
    return operation;
  },

  async createOperation(data: Record<string, any>) {
    const validated = validateOperationData(normalizeOperationInput(data));

    if (!validateDateRange(validated.startsAt, validated.endsAt)) {
      throw new Error('Operation start date must be before or equal to the end date');
    }

    if (!validateMonthYearDates(validated.month, validated.year, validated.startsAt, validated.endsAt)) {
      throw new Error('Operation dates must match the selected month and year');
    }

    return prisma.operation.create({ data: validated });
  },

  async updateOperation(id: string, data: Record<string, any>) {
    const existing = await prisma.operation.findUnique({ where: { id } });

    if (!existing) {
      const error = new Error('Operation not found');
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    const validated = validateOperationUpdateData(normalizeOperationInput(data)) as Record<string, any>;

    if (validated.startsAt && validated.endsAt && !validateDateRange(validated.startsAt, validated.endsAt)) {
      throw new Error('Operation start date must be before or equal to the end date');
    }

    if (validated.startsAt && validated.endsAt) {
      const startsAt = validated.startsAt as Date;
      const endsAt = validated.endsAt as Date;
      const month = validated.month ?? existing.month;
      const year = validated.year ?? existing.year;

      if (!validateMonthYearDates(month, year, startsAt, endsAt)) {
        throw new Error('Operation dates must match the selected month and year');
      }

      if (!validateDatesInMonthYear(month, year, startsAt, endsAt)) {
        throw new Error('Operation dates must fall within the selected month and year');
      }
    }

    return prisma.operation.update({ where: { id }, data: validated });
  },

  async deleteOperation(id: string) {
    throw new Error('Use deleteEmptyOperation para exclusão administrativa segura.');
  },

  async duplicateOperation(id: string, newMonth: number, newYear: number) {
    const source = await prisma.operation.findUnique({ where: { id } });

    if (!source) {
      const error = new Error('Operation not found');
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    const existing = await prisma.operation.findFirst({ where: { month: newMonth, year: newYear } });

    if (existing) {
      const error = new Error('An operation already exists for that month and year');
      (error as Error & { status?: number }).status = 409;
      throw error;
    }

    return prisma.operation.create({
      data: {
        name: source.name,
        month: newMonth,
        year: newYear,
        status: OperationStatus.OPEN,
        description: source.description,
        clientId: source.clientId,
        observations: source.observations,
        startsAt: source.startsAt,
        endsAt: source.endsAt,
      },
    });
  },

  async closeOperation(id: string) {
    return prisma.operation.update({
      where: { id },
      data: { status: OperationStatus.FINISHED },
    });
  },

  async archiveOperation(id: string) {
    return prisma.operation.update({
      where: { id },
      data: { status: OperationStatus.ARCHIVED },
    });
  },

  async reopenOperation(id: string) {
    return prisma.operation.update({
      where: { id },
      data: { status: OperationStatus.OPEN },
    });
  },

  async generateVisits(id: string) {
    const operation = await this.getOperationById(id);
    const [promoters, stores, industries, existingVisits] = await Promise.all([
      prisma.promoter.findMany({ where: { supervisorId: { not: '' } } }),
      prisma.store.findMany(),
      prisma.industry.findMany(),
      prisma.visit.findMany({
        where: { operationId: id },
        select: {
          id: true,
          operationId: true,
          promoterId: true,
          storeId: true,
          industryId: true,
          status: true,
          scheduledDate: true,
          completedDate: true,
          routeOrder: true,
          weeklyFrequency: true,
          plannedTime: true,
          estimatedDurationMinutes: true,
          notes: true,
          manualOverrideReason: true,
          createdAt: true,
          updatedAt: true,
          promoter: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              supervisorId: true,
            },
          },
          store: {
            select: {
              id: true,
              code: true,
              name: true,
              chain: true,
              city: true,
              state: true,
            },
          },
          industry: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          operation: {
            select: {
              id: true,
              name: true,
              month: true,
              year: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const frequencies = new Map<string, number>();

        promoters.forEach((promoter) => {
          stores.forEach((store) => {
            industries.forEach((industry) => {
              frequencies.set(`${promoter.id}-${store.id}-${industry.id}`, 1);
            });
          });
        });

        const result = await operationPlanner.generateVisits(
          operation,
          promoters,
          stores,
          industries,
          frequencies,
          existingVisits,
        );

        if (result.visitsToCreate.length === 0) {
          return { success: true, created: 0, statistics: result.statistics };
        }

        await prisma.visit.createMany({ data: result.visitsToCreate });

        return {
          success: true,
          created: result.visitsToCreate.length,
          statistics: result.statistics,
        };
  },

  async getDashboardData() {
    const currentOperation = await prisma.operation.findFirst({
      where: {
        status: OperationStatus.OPEN,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const [promoters, stores, industries, plannedVisits, realizedVisits, pendingVisits] = await Promise.all([
      prisma.promoter.count(),
      prisma.store.count(),
      prisma.industry.count(),
      prisma.visit.count({ where: { status: VisitStatus.PLANEJADA } }),
      prisma.visit.count({ where: { status: VisitStatus.REALIZADA } }),
      prisma.visit.count({ where: { status: VisitStatus.PLANEJADA } }),
    ]);

    const coverage = plannedVisits > 0 ? Math.round((realizedVisits / plannedVisits) * 100) : 0;
    const frequency = promoters > 0 ? Number((plannedVisits / promoters).toFixed(2)) : 0;

    return {
      currentOperation,
      promoters,
      stores,
      industries,
      plannedVisits,
      realizedVisits,
      pendencies: pendingVisits,
      coverage,
      frequency,
      conflicts: await prisma.visit.count({ where: { status: VisitStatus.CANCELADA } }),
    };
  },

  async getOperationStatistics(id: string) {
    const operation = await this.getOperationById(id);
    const [totalVisits, plannedVisits, realizedVisits, canceledVisits] = await Promise.all([
      prisma.visit.count({ where: { operationId: id } }),
      prisma.visit.count({ where: { operationId: id, status: VisitStatus.PLANEJADA } }),
      prisma.visit.count({ where: { operationId: id, status: VisitStatus.REALIZADA } }),
      prisma.visit.count({ where: { operationId: id, status: VisitStatus.CANCELADA } }),
    ]);

    return {
      operation,
      totalVisits,
      plannedVisits,
      realizedVisits,
      canceledVisits,
    };
  },
};

export default operationService;
