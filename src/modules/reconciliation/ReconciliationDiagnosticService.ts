import { prisma } from '@/lib/prisma';
import { dateDistanceDays, isSameIsoWeek } from './VisitReconciliationService';

export function classifyDateDifference(evidenceDate: Date, plannedDate: Date) {
  const distanceDays = dateDistanceDays(evidenceDate, plannedDate);
  const distanceBucket = distanceDays === 1
    ? 'ONE_DAY'
    : distanceDays <= 3
      ? 'TWO_TO_THREE_DAYS'
      : distanceDays === 7
        ? 'SEVEN_DAYS'
        : distanceDays > 7
          ? 'OVER_SEVEN_DAYS'
          : 'FOUR_TO_SIX_DAYS';
  return { distanceDays, distanceBucket, sameWeek: isSameIsoWeek(evidenceDate, plannedDate) };
}

export class ReconciliationDiagnosticService {
  static async report(operationId?: string) {
    const evidences = await prisma.visitEvidence.findMany({
      where: { operationId: operationId || undefined, result: { in: ['STORE_NOT_FOUND', 'DATE_MISMATCH'] } },
      orderBy: [{ rawStoreName: 'asc' }, { evidenceDate: 'asc' }],
    });
    const stores = new Map<string, { name: string; brand: string | null; city: string | null; state: string | null; count: number; origins: unknown[]; candidates: unknown }>();
    const dates = [];
    for (const evidence of evidences) {
      if (evidence.result === 'STORE_NOT_FOUND') {
        const key = [evidence.rawStoreName, evidence.rawState ?? ''].join('|');
        const group = stores.get(key) ?? { name: evidence.rawStoreName, brand: evidence.rawBrand, city: evidence.rawCity, state: evidence.rawState, count: 0, origins: [], candidates: evidence.diagnostics };
        group.count++;
        group.origins.push({ sheet: evidence.sourceSheet, row: evidence.sourceRow, file: evidence.sourceFile });
        stores.set(key, group);
      }
      if (evidence.result === 'DATE_MISMATCH' && evidence.suggestion) {
        const suggestion = evidence.suggestion as { plannedDate?: string };
        if (suggestion.plannedDate) dates.push({ evidenceId: evidence.id, ...classifyDateDifference(evidence.evidenceDate, new Date(suggestion.plannedDate)), suggestion });
      }
    }
    return { storeGroups: [...stores.values()].sort((left, right) => right.count - left.count), dateMismatches: dates };
  }
}
