import { NextRequest, NextResponse } from 'next/server';
import { operationService } from '@/modules/operations/services/OperationService';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusParam = searchParams.get('status') || undefined; // Convert null to undefined
    const searchParam = searchParams.get('search') || undefined; // Convert null to undefined

    const operations = await operationService.getOperations({
      page,
      limit,
      status: statusParam,
      search: searchParam,
    });

    return NextResponse.json(operations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch operations' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const operation = await operationService.createOperation(data);
    revalidatePath('/dashboard/operacoes');

    return NextResponse.json(operation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create operation' },
      { status: error.status || 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    const operation = await operationService.updateOperation(id, data);
    revalidatePath('/dashboard/operacoes');
    revalidatePath(`/dashboard/operacoes/${id}`);

    return NextResponse.json(operation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update operation' },
      { status: error.status || 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      );
    }

    const result = await operationService.deleteOperation(id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete operation' },
      { status: error.status || 400 }
    );
  }
}

// Additional operation-specific endpoints
export const dynamic = 'force-dynamic';
