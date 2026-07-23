import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cleanOperation, getOperationCleanupPreview, OperationCleanupError } from '@/modules/operations/services/OperationCleanupService';

const selectionSchema = z.object({
  routes: z.boolean(),
  visits: z.boolean(),
  evidences: z.boolean(),
  reconciliations: z.boolean(),
  imports: z.boolean(),
}).strict();

function authorized() {
  return process.env.NODE_ENV === 'development';
}

function failure(error: unknown) {
  if (error instanceof OperationCleanupError) return Response.json({ success: false, code: error.code, error: error.message }, { status: error.status });
  return Response.json({ success: false, code: 'OPERATION_CLEANUP_FAILED', error: 'Não foi possível limpar a operação.' }, { status: 500 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized()) return Response.json({ success: false, code: 'ADMIN_AUTH_REQUIRED', error: 'Acesso administrativo necessário.' }, { status: 403 });
  try {
    return Response.json(await getOperationCleanupPreview((await params).id));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized()) return Response.json({ success: false, code: 'ADMIN_AUTH_REQUIRED', error: 'Acesso administrativo necessário.' }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ success: false, code: 'INVALID_CLEANUP_SELECTION', error: 'Seleção de limpeza inválida.' }, { status: 400 }); }
  const parsed = selectionSchema.safeParse(body);
  if (!parsed.success) return Response.json({ success: false, code: 'INVALID_CLEANUP_SELECTION', error: 'Seleção de limpeza inválida.' }, { status: 400 });
  try {
    const result = await cleanOperation((await params).id, parsed.data);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/operacoes');
    revalidatePath(`/dashboard/operacoes/${(await params).id}`);
    return Response.json(result);
  } catch (error) {
    return failure(error);
  }
}
