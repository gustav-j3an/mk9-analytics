import { unsafeRollbackPreview } from '@/modules/imports/services/ImportDeletionService';
import { authorizeImportAdmin } from '../route';

export async function POST(request: Request) {
  if (!authorizeImportAdmin(request).authorized) {
    return Response.json({ success: false, code: 'IMPORT_DELETE_FORBIDDEN', error: 'Apenas administradores podem desfazer importações.' }, { status: 403 });
  }
  return Response.json(unsafeRollbackPreview, { status: 409 });
}
