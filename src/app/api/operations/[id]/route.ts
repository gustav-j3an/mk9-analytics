import { NextRequest, NextResponse } from 'next/server';
import { operationService } from '@/modules/operations/services/OperationService';
import { revalidatePath } from 'next/cache';

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

    let result;
    switch (action) {
      case 'duplicate':
        const { newMonth, newYear } = await request.json();
        if (!newMonth || !newYear) {
          return NextResponse.json(
            { error: 'newMonth and newYear are required for duplication' },
            { status: 400 }
          );
        }
        result = await operationService.duplicateOperation(id, parseInt(newMonth), parseInt(newYear));
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

// Additional operation-specific endpoints
export const dynamic = 'force-dynamic';
