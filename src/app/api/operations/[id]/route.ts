import { NextRequest, NextResponse } from 'next/server';
import { operationService } from '@/modules/operations/services/OperationService';
import { revalidatePath } from 'next/cache';
import { deleteEmptyOperation, duplicateOperationConfiguration, getOperationDeletionPreview, OperationLifecycleError } from '@/modules/operations/services/OperationLifecycleService';

function adminAuthorized() {
  return process.env.NODE_ENV === 'development';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      );
    }

    const operation = await operationService.getOperationById(id);

    return NextResponse.json(operation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch operation' },
      { status: error.status || 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      );
    }
    if (!adminAuthorized()) return NextResponse.json({ code: 'ADMIN_AUTH_REQUIRED', error: 'Acesso administrativo necessário.' }, { status: 403 });

    let result;
    switch (action) {
      case 'duplicate':
        result = await duplicateOperationConfiguration(id);
        break;
      case 'close':
        result = await operationService.closeOperation(id);
        break;
      case 'archive':
        result = await operationService.archiveOperation(id);
        break;
      case 'reopen':
        result = await operationService.reopenOperation(id);
        break;
      case 'generate-visits':
        result = await operationService.generateVisits(id);
        break;
      case 'statistics':
        result = await operationService.getOperationStatistics(id);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

    revalidatePath('/dashboard/operacoes');
    revalidatePath(`/dashboard/operacoes/${id}`);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: error.status || 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuthorized()) return NextResponse.json({ code: 'ADMIN_AUTH_REQUIRED', error: 'Acesso administrativo necessário.' }, { status: 403 });
  const { id } = await params;
  try {
    const body = await request.json() as { confirmation?: string };
    const result = await deleteEmptyOperation(id, body.confirmation ?? '');
    revalidatePath('/dashboard/operacoes');
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OperationLifecycleError) {
      return NextResponse.json({ code: error.code, error: error.message, impact: error.impact }, { status: error.status });
    }
    return NextResponse.json({ code: 'OPERATION_DELETE_FAILED', error: 'Não foi possível excluir a operação.' }, { status: 500 });
  }
}

export async function OPTIONS(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuthorized()) return NextResponse.json({ code: 'ADMIN_AUTH_REQUIRED', error: 'Acesso administrativo necessário.' }, { status: 403 });
  try {
    return NextResponse.json(await getOperationDeletionPreview((await params).id));
  } catch (error) {
    if (error instanceof OperationLifecycleError) return NextResponse.json({ code: error.code, error: error.message }, { status: error.status });
    return NextResponse.json({ code: 'OPERATION_DELETE_FAILED', error: 'Não foi possível analisar a operação.' }, { status: 500 });
  }
}

// Additional operation-specific endpoints
export const dynamic = 'force-dynamic';
