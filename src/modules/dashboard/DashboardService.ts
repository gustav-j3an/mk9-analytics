import { DashboardRepository } from './DashboardRepository';
import type { DashboardKPIs } from './dashboard.types';

export class DashboardService {
  static async getKPIs(): Promise<DashboardKPIs> {
    const [
      totalOperations,
      totalStores,
      totalIndustries,
      totalPromoters,
      totalVisits,
      pendingVisitsCount,
      failedImportsCount,
      lastImportDate,
    ] = await Promise.all([
      DashboardRepository.getOperationsCount(),
      DashboardRepository.getStoresCount(),
      DashboardRepository.getIndustriesCount(),
      DashboardRepository.getPromotersCount(),
      DashboardRepository.getVisitsCount(),
      DashboardRepository.getPendingVisitsCount(),
      DashboardRepository.getFailedImportsCount(),
      DashboardRepository.getLastImportDate(),
    ]);

    return {
      totalOperations,
      totalStores,
      totalIndustries,
      totalPromoters,
      totalVisits,
      pendingVisitsCount,
      failedImportsCount,
      lastImportDate: lastImportDate ? lastImportDate.toLocaleDateString('pt-BR') : null,
    };
  }
}
