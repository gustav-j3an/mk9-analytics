import { RoutesDashboardRepository, type RouteFilters } from './RoutesDashboardRepository';
export function normalizeManualVisitFields(visit: {
  routeOrder?: number | null;
  weeklyFrequency?: number | null;
  plannedTime?: string | null;
  estimatedDurationMinutes?: number | null;
  notes?: string | null;
}) {
  return {
    routeOrder: visit.routeOrder ?? null,
    weeklyFrequency: visit.weeklyFrequency ?? 1,
    plannedTime: visit.plannedTime ?? null,
    estimatedDurationMinutes: visit.estimatedDurationMinutes ?? null,
    notes: visit.notes ?? null,
  };
}

export const WEEK_DAYS = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
] as const;

export class RoutesDashboardService {
  static async getData(filters: RouteFilters) {
    const [visits, options] = await Promise.all([
      RoutesDashboardRepository.getVisits(filters),
      RoutesDashboardRepository.getFilterOptions(),
    ]);
    const days = WEEK_DAYS.map((day) => ({
      ...day,
      visits: visits.filter((visit) => visit.scheduledDate.getUTCDay() === day.value).map((visit) => ({
        id: visit.id,
        operationId: visit.operation.id,
        promoterId: visit.promoter.id,
        promoter: visit.promoter.name,
        storeId: visit.store.id,
        store: visit.store.name,
        industryId: visit.industry.id,
        industry: visit.industry.name,
        operation: visit.operation.name,
        scheduledDate: visit.scheduledDate.toISOString(),
        status: visit.status,
        ...normalizeManualVisitFields(visit),
      })),
    }));
    return { days, options, total: visits.length };
  }
}
