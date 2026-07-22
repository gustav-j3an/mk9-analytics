import { NextRequest, NextResponse } from 'next/server';
import { storeService } from '@/modules/stores/services/StoreService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchParam = searchParams.get('search') || undefined;
    const cityParam = searchParams.get('city') || undefined;
    const stateParam = searchParams.get('state') || undefined;
    const operationId = searchParams.get('operationId') || undefined;
    const archived = (searchParams.get('archived') || 'active') as 'active' | 'archived' | 'all';

    const stores = await storeService.getStores({
      page,
      limit,
      search: searchParam,
      city: cityParam,
      state: stateParam,
      operationId,
      archived,
    });

    return NextResponse.json(stores);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stores' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const store = await storeService.createStore(data);

    return NextResponse.json(store, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create store' },
      { status: error.status || 400 }
    );
  }
}

export const dynamic = 'force-dynamic';
