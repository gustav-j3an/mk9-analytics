import type { RoutesDashboardService } from '@/modules/routes/dashboard/RoutesDashboardService';
type Days = Awaited<ReturnType<typeof RoutesDashboardService.getData>>['days'];

export function WeeklyRouteCalendar({ days }: { days: Days }) {
  return <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{days.map((day) => <div key={day.value} className="rounded-xl border bg-white"><h2 className="border-b p-3 text-xs font-bold">{day.label} - {day.visits.length}</h2><div className="space-y-2 p-2">{day.visits.map((visit) => <article key={visit.id} className="rounded border p-2 text-xs"><b>{visit.store}</b><p>{visit.industry}</p><p>{visit.promoter}</p></article>)}</div></div>)}</section>;
}
