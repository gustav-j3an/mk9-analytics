import { OperationsDashboardRepository } from './OperationsDashboardRepository';
import type { OperationItem, OperationsPagination, OperationsStatsData, OperationSort, SortDirection } from './operations-dashboard.types';

export class OperationsDashboardService {
  static async getDashboardData(filters: {
    status?: string;
    cliente?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    archived?: string;
    sort?: OperationSort;
    direction?: SortDirection;
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
        responsible: [...new Set(op.visits.map((visit) => visit.promoter.supervisor.name))].sort().join(', ') || 'Não definido',
        startsAt: op.startsAt.toISOString(),
        endsAt: op.endsAt.toISOString(),
        storesCount: uniqueStoreIds.size,
        promotersCount: uniquePromoterIds.size,
        industriesCount: new Set(op.visits.map((visit) => visit.industry.name)).size,
        visitsPlannedCount,
        visitsExecutedCount,
        pendingCount: op.visits.filter((visit) => visit.status === 'PLANEJADA').length,
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

    if (filters.archived !== 'all') {
      filteredOperations = filteredOperations.filter((op) => op.status !== 'ARCHIVED');
    }

    if (filters.status) {
      filteredOperations = filteredOperations.filter((op) => op.status === filters.status);
    }

    if (filters.cliente) {
      filteredOperations = filteredOperations.filter((op) => op.clientId === filters.cliente);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      filteredOperations = filteredOperations.filter((op) =>
        [op.name, op.clientId ?? '', op.responsible].some((value) => value.toLowerCase().includes(query))
      );
    }

    const sort = filters.sort ?? 'updatedAt';
    const direction = filters.direction === 'asc' ? 1 : -1;
    filteredOperations.sort((a, b) => {
      const left = sort === 'name' ? a.name : sort === 'coverage' ? a.coverage : Date.parse(a[sort]);
      const right = sort === 'name' ? b.name : sort === 'coverage' ? b.coverage : Date.parse(b[sort]);
      return (typeof left === 'string' ? left.localeCompare(String(right), 'pt-BR') : Number(left) - Number(right)) * direction;
    });

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
