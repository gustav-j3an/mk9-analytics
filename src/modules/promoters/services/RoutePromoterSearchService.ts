import { prisma } from '@/lib/prisma';

export type RoutePromoterSearchInput = {
  query?: string;
  operationId?: string;
  weekStart: Date;
  weekEnd: Date;
  limit?: number;
};

export function normalizePromoterSearch(value?: string) {
  return value?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? '';
}

export async function searchPromotersForRoute(input: RoutePromoterSearchInput) {
  const query = normalizePromoterSearch(input.query);
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 20);
  const search = query.length >= 2 ? {
    OR: [
      { name: { contains: query, mode: 'insensitive' as const } },
      { phone: { contains: query, mode: 'insensitive' as const } },
      { email: { contains: query, mode: 'insensitive' as const } },
      { city: { contains: query, mode: 'insensitive' as const } },
      { state: { contains: query, mode: 'insensitive' as const } },
    ],
  } : {};
  const compatibility = input.operationId ? {
    OR: [
      { operationId: input.operationId },
      { operationId: null },
      { visits: { some: { operationId: input.operationId } } },
    ],
  } : {};
  const promoters = await prisma.promoter.findMany({
    where: {
      archivedAt: null,
      deletedAt: null,
      status: 'ACTIVE',
      AND: [search, compatibility],
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      city: true,
      state: true,
      status: true,
      operationId: true,
      visits: {
        where: {
          operationId: input.operationId || undefined,
          scheduledDate: { gte: input.weekStart, lte: input.weekEnd },
        },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
    take: limit,
  });
  return promoters
    .map(({ visits, ...promoter }) => ({
      ...promoter,
      weekVisitCount: visits.length,
      alreadyInWeek: visits.length > 0,
    }))
    .sort((a, b) => {
      const prefixA = query && a.name.toLocaleLowerCase('pt-BR').startsWith(query.toLocaleLowerCase('pt-BR')) ? 0 : 1;
      const prefixB = query && b.name.toLocaleLowerCase('pt-BR').startsWith(query.toLocaleLowerCase('pt-BR')) ? 0 : 1;
      return prefixA - prefixB || a.name.localeCompare(b.name, 'pt-BR');
    });
}
