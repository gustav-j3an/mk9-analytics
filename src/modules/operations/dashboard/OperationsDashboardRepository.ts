import { prisma } from '@/lib/prisma';

export class OperationsDashboardRepository {
  static async getOperationsList() {
    return prisma.operation.findMany({
      orderBy: { startsAt: 'desc' },
      include: {
        visits: {
          select: {
            status: true,
            storeId: true,
            promoterId: true,
          },
        },
      },
    });
  }
}
