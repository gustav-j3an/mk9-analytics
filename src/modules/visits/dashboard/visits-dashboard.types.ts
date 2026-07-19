import type { VisitStatus } from '@prisma/client';

export interface VisitItem {
  id: string;
  promoterName: string;
  supervisorName: string;
  operationName: string;
  industryName: string;
  storeName: string;
  scheduledDate: string;
  completedDate: string | null;
  status: VisitStatus;
  fotoUrl: string | null;
  checklistStatus: string;
}

export interface VisitsSummaryData {
  totalPlanned: number;
  totalExecuted: number;
  totalPending: number;
  totalOverdue: number;
  coverage: number;
  promoterCompletionRates: Array<{ promoterName: string; rate: number }>;
  operationCompletionRates: Array<{ operationName: string; rate: number }>;
}
