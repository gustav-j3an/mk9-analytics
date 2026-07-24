import { z } from 'zod';
import { searchPromotersForRoute } from '@/modules/promoters/services/RoutePromoterSearchService';

const querySchema = z.object({
  q: z.string().max(80).optional().default(''),
  operationId: z.string().cuid().optional(),
  weekStart: z.iso.date(),
}).strict();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return Response.json({ error: 'Parâmetros de busca inválidos.' }, { status: 400 });
  const weekStart = new Date(`${parsed.data.weekStart}T00:00:00.000Z`);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000 - 1);
  try {
    const items = await searchPromotersForRoute({ query: parsed.data.q, operationId: parsed.data.operationId, weekStart, weekEnd });
    return Response.json({ items });
  } catch (error) {
    console.error('[routes:promoter-search]', {
      operation: 'search',
      timestamp: new Date().toISOString(),
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: 'Não foi possível consultar os promotores.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
