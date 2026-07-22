import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { storeKey } from '@/modules/reconciliation/store-similarity';
import { ReconciliationReprocessService } from '@/modules/reconciliation/ReconciliationReprocessService';
import { canonicalize } from '@/modules/shared/normalization';

type Body = {
  action: 'LINK' | 'UNPLANNED' | 'UNDO' | 'SAVE_ALIAS' | 'REPROCESS' | 'CORRECT';
  visitId?: string;
  storeId?: string;
  industryId?: string;
  operationId?: string;
  evidenceDate?: string;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'ADMIN_AUTH_REQUIRED' }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json() as Body;
  try {
    const evidence = await prisma.$transaction(async (tx) => {
      const current = await tx.visitEvidence.findUnique({ where: { id } });
      if (!current) throw new Error('EVIDENCE_NOT_FOUND');
      if (body.action === 'REPROCESS') return ReconciliationReprocessService.reprocess(id, tx);
      if (body.action === 'SAVE_ALIAS') {
        if (!body.storeId) throw new Error('STORE_REQUIRED');
        await tx.storeAlias.upsert({
          where: { aliasKey: storeKey(current.rawStoreName) },
          create: { aliasKey: storeKey(current.rawStoreName), alias: current.rawStoreName, storeId: body.storeId },
          update: { alias: current.rawStoreName, storeId: body.storeId },
        });
        return ReconciliationReprocessService.reprocess(id, tx);
      }
      if (body.action === 'CORRECT') {
        if (body.industryId) {
          const industry = await tx.industry.findUnique({ where: { id: body.industryId } });
          if (!industry) throw new Error('INDUSTRY_NOT_FOUND');
          await tx.industryAlias.upsert({
            where: { aliasKey: canonicalize(current.rawIndustryName) },
            create: { aliasKey: canonicalize(current.rawIndustryName), alias: current.rawIndustryName, industryId: industry.id },
            update: { alias: current.rawIndustryName, industryId: industry.id },
          });
        }
        await tx.visitEvidence.update({
          where: { id },
          data: {
            operationId: body.operationId,
            evidenceDate: body.evidenceDate ? new Date(body.evidenceDate) : undefined,
          },
        });
        return ReconciliationReprocessService.reprocess(id, tx);
      }
      const before = JSON.parse(JSON.stringify(current)) as Prisma.InputJsonValue;
      let data: Prisma.VisitEvidenceUpdateInput;
      if (body.action === 'LINK') {
        if (!body.visitId) throw new Error('VISIT_REQUIRED');
        const visit = await tx.visit.findUnique({ where: { id: body.visitId } });
        if (!visit || visit.operationId !== current.operationId) throw new Error('INVALID_VISIT');
        data = { visit: { connect: { id: visit.id } }, store: { connect: { id: visit.storeId } }, industry: { connect: { id: visit.industryId } }, result: 'MATCHED', confidence: 100, reviewedAt: new Date(), reviewedBy: 'ADMIN' };
        await tx.visit.update({ where: { id: visit.id }, data: { status: 'REALIZADA', completedDate: current.evidenceDate } });
      } else if (body.action === 'UNDO') {
        data = { visit: { disconnect: true }, result: 'UNPLANNED', confidence: 0, reviewedAt: null, reviewedBy: null };
      } else {
        data = { visit: { disconnect: true }, result: 'UNPLANNED', reviewedAt: new Date(), reviewedBy: 'ADMIN' };
      }
      const updated = await tx.visitEvidence.update({ where: { id }, data });
      await tx.reconciliationAudit.create({ data: { evidenceId: id, action: body.action, actor: 'ADMIN', before, after: JSON.parse(JSON.stringify(updated)) as Prisma.InputJsonValue } });
      return updated;
    });
    return Response.json({ evidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RECONCILIATION_UPDATE_FAILED';
    return Response.json({ error: message }, { status: message === 'EVIDENCE_NOT_FOUND' ? 404 : 400 });
  }
}
