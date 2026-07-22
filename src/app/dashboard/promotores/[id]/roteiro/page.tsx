import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/PageHeader';
import { WeeklyRouteCalendar } from '@/components/routes/WeeklyRouteCalendar';
import { RoutesDashboardService } from '@/modules/routes/dashboard/RoutesDashboardService';

export const dynamic = 'force-dynamic';

export default async function PromoterRoutePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ operation?: string; industry?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const promoter = await prisma.promoter.findUnique({ where: { id }, include: { supervisor: true } });
  if (!promoter) notFound();
  const data = await RoutesDashboardService.getData({ promoterId: id, operationId: query.operation, industryId: query.industry });
  return <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <div><Link href="/dashboard/promotores" className="text-xs font-medium text-[#73736f]">← Promotores</Link><PageHeader category="Promotor" title={promoter.name} subtitle={`Roteiro semanal · Supervisor: ${promoter.supervisor.name}`} /></div>
    <form className="grid gap-3 rounded-xl border border-[#deded9] bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
      <select name="operation" defaultValue={query.operation ?? ''} className="h-9 rounded-md border px-3 text-xs"><option value="">Todas as operações</option>{data.options.operations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="industry" defaultValue={query.industry ?? ''} className="h-9 rounded-md border px-3 text-xs"><option value="">Todas as indústrias</option>{data.options.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button className="h-9 rounded-md bg-[#20201f] px-4 text-xs font-semibold text-white">Filtrar</button>
    </form>
    <WeeklyRouteCalendar days={data.days} />
  </main>;
}
