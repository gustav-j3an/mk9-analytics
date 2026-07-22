import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { storeService } from '@/modules/stores/services/StoreService';

const failure = (error: unknown) => {
  const value = error as Error & { status?: number };
  return NextResponse.json({ error: value.message || 'Não foi possível processar a loja.' }, { status: value.status || 400 });
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json(await storeService.getStoreById((await params).id)); } catch (error) { return failure(error); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const store = await storeService.updateStore(id, await request.json());
    revalidatePath('/dashboard/lojas'); revalidatePath(`/dashboard/lojas/${id}`);
    return NextResponse.json(store);
  } catch (error) { return failure(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { action?: string };
    if (!['archive', 'restore'].includes(body.action || '')) return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
    const store = await storeService.setArchived(id, body.action === 'archive');
    revalidatePath('/dashboard/lojas'); revalidatePath(`/dashboard/lojas/${id}`);
    return NextResponse.json(store);
  } catch (error) { return failure(error); }
}

export const dynamic = 'force-dynamic';
