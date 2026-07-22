import type { Prisma } from '@prisma/client';
import { VisitMatchRepository } from './VisitMatchRepository';
import { VisitReconciliationService } from './VisitReconciliationService';

export class ReconciliationReprocessService {
  static async reprocess(evidenceId: string, tx: Prisma.TransactionClient) {
    const evidence = await tx.visitEvidence.findUnique({ where: { id: evidenceId }, include: { operation: true } });
    if (!evidence) throw new Error('EVIDENCE_NOT_FOUND');
    const service = new VisitReconciliationService(new VisitMatchRepository(tx));
    const decision = await service.reconcile({
      importId: evidence.importId,
      operationId: evidence.operationId,
      evidenceDate: evidence.evidenceDate,
      storeName: evidence.rawStoreName,
      industryName: evidence.rawIndustryName,
      sourceFile: evidence.sourceFile,
      sourceSheet: evidence.sourceSheet ?? undefined,
      sourceRow: evidence.sourceRow ?? undefined,
      state: evidence.rawState ?? undefined,
      city: evidence.rawCity ?? undefined,
      brand: evidence.rawBrand ?? undefined,
      operationStartsAt: evidence.operation.startsAt,
      operationEndsAt: evidence.operation.endsAt,
      existingEvidenceKey: evidence.deduplicationKey,
    }, { reprocess: true });
    await tx.reconciliationAudit.create({
      data: { evidenceId, action: 'REPROCESS', actor: 'ADMIN_DEV', after: JSON.parse(JSON.stringify(decision)) },
    });
    return decision;
  }
}
