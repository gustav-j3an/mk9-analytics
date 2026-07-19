import { prisma } from '@/lib/prisma';

export class VisitsDashboardRepository {
  static async getVisitsList() {
    return prisma.visit.findMany({
      orderBy: { scheduledDate: 'desc' },
      include: {
        promoter: {
          include: {
            supervisor: true,
          },
        },
        store: true,
        industry: true,
        operation: true,
      },
    });
  }
}
