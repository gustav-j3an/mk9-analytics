import { OperationsDashboardRepository } from './OperationsDashboardRepository';
import type { OperationItem, OperationsStatsData } from './operations-dashboard.types';

export class OperationsDashboardService {
  static async getDashboardData(filters: {
    status?: string;
    cliente?: string;
    search?: string;
  }): Promise<{
    operations: OperationItem[];
    stats: OperationsStatsData;
    uniqueClients: string[];
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
        storesCount: uniqueStoreIds.size,
        promotersCount: uniquePromoterIds.size,
        visitsPlannedCount,
        visitsExecutedCount,
        coverage,
        createdAt: op.createdAt.toLocaleString('pt-BR'),
        updatedAt: op.updatedAt.toLocaleString('pt-BR'),
      };
    });

    const activeCount = operations.filter(
      (op) => op.status === 'OPEN' || op.status === 'IN_PROGRESS' || op.status === 'PLANNING'
    ).length;
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

    return {
      operations: filteredOperations,
      stats: {
        activeCount,
        finishedCount,
        archivedCount,
      },
      uniqueClients,
    };
  }
}
