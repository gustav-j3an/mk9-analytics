import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashSha256 } from '@/modules/imports/services/ImportPreviewArtifactService';
import { RoteiroSyncService } from '@/modules/imports/services/RoteiroSyncService';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { previewToken, month, year, syncMode } = body;

    if (!previewToken || !month || !year || !syncMode) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos para análise do roteiro.' },
        { status: 400 }
      );
    }

    const tokenHash = hashSha256(previewToken);
    const artifact = await prisma.importPreviewArtifact.findUnique({
      where: { tokenHash }
    });

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Preview expirado ou não encontrado.' },
        { status: 404 }
      );
    }

    const payload = artifact.payload as any;
    const rows = payload.rows || [];
    const rawRows = rows.map((r: any) => r.data);
    const auxiliary = payload.auxiliary;

    // Perform analysis
    const analysis = await RoteiroSyncService.analyze({
      rows: rawRows,
      auxiliary,
      month: Number(month),
      year: Number(year),
      syncMode
    });

    // Update the payload in the artifact database so that the confirmation route
    // can retrieve the selected month, year, and syncMode.
    const updatedPayload = {
      ...payload,
      month: Number(month),
      year: Number(year),
      syncMode,
      audit: {
        ...payload.audit,
        month: Number(month),
        year: Number(year),
        syncMode
      }
    };

    await prisma.importPreviewArtifact.update({
      where: { id: artifact.id },
      data: { payload: updatedPayload }
    });

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    console.error('Error analyzing spreadsheet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao analisar planilha.' },
      { status: 500 }
    );
  }
}
