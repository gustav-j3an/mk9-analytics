export interface DashboardKPIs {
  totalOperations: number;
  totalStores: number;
  totalIndustries: number;
  totalPromoters: number;
  totalVisits: number;
  lastImportDate: string | null;
  failedImportsCount: number;
  pendingVisitsCount: number;
}
