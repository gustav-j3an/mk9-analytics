import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canSearch, normalizeSearchQuery, type SearchResult } from '@/lib/global-search';

export async function GET(request: NextRequest) {
  const query = normalizeSearchQuery(request.nextUrl.searchParams.get('q'));
  if (!canSearch(query)) return NextResponse.json({ results: [] });

  const [operations, promoters, stores, industries] = await Promise.all([
    prisma.operation.findMany({ where: { name: { contains: query, mode: 'insensitive' } }, select: { id: true, name: true, year: true }, take: 5 }),
    prisma.promoter.findMany({ where: { deletedAt: null, name: { contains: query, mode: 'insensitive' } }, select: { id: true, name: true, city: true, state: true }, take: 5 }),
    prisma.store.findMany({ where: { name: { contains: query, mode: 'insensitive' } }, select: { id: true, name: true, city: true, state: true }, take: 5 }),
    prisma.industry.findMany({ where: { name: { contains: query, mode: 'insensitive' } }, select: { id: true, name: true, code: true }, take: 5 }),
  ]);

  const results: SearchResult[] = [
    ...operations.map((x) => ({ id: x.id, title: x.name, subtitle: `Operação · ${x.year}`, href: `/dashboard/operacoes/${x.id}`, type: 'operation' })),
    ...promoters.map((x) => ({ id: x.id, title: x.name, subtitle: `Promotor · ${[x.city, x.state].filter(Boolean).join('/') || 'Sem localidade'}`, href: `/dashboard/promotores/${x.id}`, type: 'promoter' })),
    ...stores.map((x) => ({ id: x.id, title: x.name, subtitle: `Loja · ${[x.city, x.state].filter(Boolean).join('/') || 'Sem localidade'}`, href: `/dashboard/lojas/${x.id}`, type: 'store' })),
    ...industries.map((x) => ({ id: x.id, title: x.name, subtitle: `Indústria · ${x.code}`, href: `/dashboard/industrias/${x.id}`, type: 'industry' })),
  ];
  return NextResponse.json({ results });
}
