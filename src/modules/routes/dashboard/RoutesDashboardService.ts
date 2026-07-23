import { RoutesDashboardRepository, type RouteFilters } from './RoutesDashboardRepository';

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
        routeOrder: (visit as typeof visit & { routeOrder?: number | null }).routeOrder ?? null,
        weeklyFrequency: (visit as typeof visit & { weeklyFrequency?: number }).weeklyFrequency ?? 1,
        plannedTime: (visit as typeof visit & { plannedTime?: string | null }).plannedTime ?? null,
        estimatedDurationMinutes: (visit as typeof visit & { estimatedDurationMinutes?: number | null }).estimatedDurationMinutes ?? null,
        notes: (visit as typeof visit & { notes?: string | null }).notes ?? null,
      })),
    }));
    return { days, options, total: visits.length };
  }
}
