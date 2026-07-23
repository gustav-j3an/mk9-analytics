import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ManualRouteError, saveWeeklyRouteBatch } from '@/modules/routes/services/ManualWeeklyRouteService';

const visitSchema = z.object({
  id: z.string().optional(),
  operationId: z.string().min(1),
  promoterId: z.string().min(1),
  storeId: z.string().min(1),
  industryIds: z.array(z.string().min(1)).min(1),
  scheduledDate: z.iso.datetime(),
  routeOrder: z.number().int().positive(),
  weeklyFrequency: z.number().int().positive(),
  plannedTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  estimatedDurationMinutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  status: z.enum(['PLANEJADA', 'REALIZADA', 'CANCELADA']),
  conflictJustification: z.string().max(500).optional(),
}).strict();
const batchSchema = z.object({ upserts: z.array(visitSchema).max(1000), deleteIds: z.array(z.string()).max(1000), scopeOperationIds: z.array(z.string().min(1)).min(1).max(100) }).strict();

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return Response.json({ success: false, code: 'ADMIN_AUTH_REQUIRED', error: 'Acesso administrativo necessário.' }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ success: false, code: 'INVALID_ROUTE', error: 'Payload inválido.' }, { status: 400 }); }
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ success: false, code: 'INVALID_ROUTE', error: parsed.error.issues[0]?.message || 'Payload inválido.' }, { status: 400 });
  try {
    const result = await saveWeeklyRouteBatch(parsed.data);
    revalidatePath('/dashboard/roteiros');
    revalidatePath('/dashboard/operacoes');
    return Response.json(result);
  } catch (error) {
    if (error instanceof ManualRouteError) return Response.json({ success: false, code: error.code, error: error.message, conflicts: error.conflicts }, { status: error.status });
    return Response.json({ success: false, code: 'ROUTE_SAVE_FAILED', error: 'Não foi possível salvar o roteiro.' }, { status: 500 });
  }
}
