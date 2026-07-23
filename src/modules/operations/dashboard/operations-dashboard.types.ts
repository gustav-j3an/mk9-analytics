import type { OperationStatus } from '@prisma/client';

export interface OperationItem {
  id: string;
  name: string;
  clientId: string | null;
  status: OperationStatus;
  industries: string[];
  supervisorNames: string[];
  responsible: string;
  startsAt: string;
  endsAt: string;
  storesCount: number;
  promotersCount: number;
  industriesCount: number;
  visitsPlannedCount: number;
  visitsExecutedCount: number;
  pendingCount: number;
  coverage: number;
  createdAt: string;
  updatedAt: string;
}

export interface OperationsStatsData {
  totalCount: number;
  activeCount: number;
  planningCount: number;
  finishedCount: number;
  archivedCount: number;
}

export interface OperationsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type OperationSort = 'updatedAt' | 'name' | 'startsAt' | 'coverage';
export type SortDirection = 'asc' | 'desc';
