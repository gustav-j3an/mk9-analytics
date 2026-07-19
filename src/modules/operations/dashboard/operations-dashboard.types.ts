import type { OperationStatus } from '@prisma/client';

export interface OperationItem {
  id: string;
  name: string;
  clientId: string | null;
  status: OperationStatus;
  storesCount: number;
  promotersCount: number;
  visitsPlannedCount: number;
  visitsExecutedCount: number;
  coverage: number;
  createdAt: string;
  updatedAt: string;
}

export interface OperationsStatsData {
  activeCount: number;
  finishedCount: number;
  archivedCount: number;
}
