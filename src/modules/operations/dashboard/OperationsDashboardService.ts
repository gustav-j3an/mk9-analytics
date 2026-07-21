import { OperationsDashboardRepository } from './OperationsDashboardRepository';
import type { OperationItem, OperationsPagination, OperationsStatsData } from './operations-dashboard.types';

export class OperationsDashboardService {
  static async getDashboardData(filters: {
    status?: string;
    cliente?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    operations: OperationItem[];
    stats: OperationsStatsData;
    uniqueClients: string[];
    pagination: OperationsPagination;
  }> {
    const rawOperations = await OperationsDashboardRepository.getOperationsList();

    const operations: OperationItem[] = rawOperations.map((op) => {
      const uniqueStoreIds = new Set(op.visits.map((v) => v.storeId));
      const uniquePromoterIds = new Set(op.visits.map((v) => v.promoterId));

      const visitsPlannedCount = op.visits.length;
      const visitsExecutedCount = op.visits.filter((v) => v.status === 'REALIZADA').length;
      const coverage =
        visitsPlannedCount > 0 ? Math.round((visitsExecutedCount / visitsPlannedCount) * 100) : 0;

      return {
        id: op.id,
        name: op.name,
        clientId: op.clientId,
        status: op.status,
        industries: [...new Set(op.visits.map((visit) => visit.industry.name))].sort(),
        supervisorNames: [...new Set(op.visits.map((visit) => visit.promoter.supervisor.name))].sort(),
        startsAt: op.startsAt.toISOString(),
        endsAt: op.endsAt.toISOString(),
        storesCount: uniqueStoreIds.size,
        promotersCount: uniquePromoterIds.size,
        visitsPlannedCount,
        visitsExecutedCount,
        coverage,
        createdAt: op.createdAt.toISOString(),
        updatedAt: op.updatedAt.toISOString(),
      };
    });

    const activeCount = operations.filter(
      (op) => op.status === 'OPEN' || op.status === 'IN_PROGRESS'
    ).length;
    const planningCount = operations.filter((op) => op.status === 'PLANNING').length;
    const finishedCount = operations.filter((op) => op.status === 'FINISHED').length;
    const archivedCount = operations.filter(
      (op) => op.status === 'ARCHIVED' || op.status === 'CANCELLED'
    ).length;

    const uniqueClients = Array.from(
      new Set(operations.map((op) => op.clientId).filter(Boolean))
    ) as string[];

    let filteredOperations = operations;

    if (filters.status) {
      filteredOperations = filteredOperations.filter((op) => op.status === filters.status);
    }

    if (filters.cliente) {
      filteredOperations = filteredOperations.filter((op) => op.clientId === filters.cliente);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      filteredOperations = filteredOperations.filter((op) => op.name.toLowerCase().includes(query));
    }

    const pageSize = Math.min(50, Math.max(5, filters.pageSize ?? 10));
    const total = filteredOperations.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(totalPages, Math.max(1, filters.page ?? 1));

    return {
      operations: filteredOperations.slice((page - 1) * pageSize, page * pageSize),
      stats: {
        totalCount: operations.length,
        activeCount,
        planningCount,
        finishedCount,
        archivedCount,
      },
      uniqueClients,
      pagination: { page, pageSize, total, totalPages },
    };
  }
}
