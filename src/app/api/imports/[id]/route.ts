import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { deleteImportRecord, ImportDeleteError } from '@/modules/imports/services/ImportDeletionService';

const bodySchema = z.object({
  confirmation: z.literal('EXCLUIR'),
  reason: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().min(8).max(200),
});

export type ImportAdminAuthorization = (request: Request) => { authorized: boolean; actor: string };

// O projeto ainda não possui sessão/autenticação. Mantemos a mutação fechada em
// produção e reconhecemos o ambiente local como o administrador de desenvolvimento.
export const authorizeImportAdmin: ImportAdminAuthorization = () => ({
  authorized: process.env.NODE_ENV === 'development',
  actor: 'ADMIN_DEV',
});

export async function handleDeleteImport(
  request: Request,
  context: { params: Promise<{ id: string }> },
  authorize: ImportAdminAuthorization = authorizeImportAdmin,
  remove = deleteImportRecord,
) {
  const authorization = authorize(request);
  if (!authorization.authorized) {
    return Response.json({ success: false, code: 'ADMIN_AUTH_REQUIRED', error: 'Apenas administradores podem excluir importações.' }, { status: 403 });
  }
  const parsedId = z.string().cuid().safeParse((await context.params).id);
  if (!parsedId.success) {
    return Response.json({ success: false, code: 'IMPORT_NOT_FOUND', error: 'Importação não encontrada.' }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, code: 'IMPORT_DELETE_FORBIDDEN', error: 'Confirmação de exclusão inválida.' }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, code: 'IMPORT_DELETE_FORBIDDEN', error: 'Confirmação de exclusão inválida.' }, { status: 403 });
  }
  try {
    const result = await remove({ id: parsedId.data, actor: authorization.actor, ...parsed.data });
    try {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/importacoes');
    } catch (error) {
      // A exclusão já foi confirmada no banco; falha de invalidação de cache não
      // deve transformar uma operação concluída em erro nem incentivar repetição.
      console.error('[imports:delete] cache revalidation failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return Response.json(result);
  } catch (error) {
    if (error instanceof ImportDeleteError) {
      return Response.json({ success: false, code: error.code, error: error.message }, { status: error.httpStatus });
    }
    return Response.json({ success: false, code: 'IMPORT_DELETE_FAILED', error: 'Não foi possível excluir o registro da importação.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleDeleteImport(request, context);
}
