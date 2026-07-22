export type ReconciliationResult =
  | 'MATCHED'
  | 'UNPLANNED'
  | 'AMBIGUOUS'
  | 'DATE_MISMATCH'
  | 'STORE_NOT_FOUND'
  | 'INDUSTRY_NOT_FOUND'
  | 'DUPLICATE_EVIDENCE';

export interface EvidenceInput {
  importId: string;
  operationId: string;
  evidenceDate: Date;
  storeName: string;
  industryName: string;
  sourceFile: string;
  sourceSheet?: string;
  sourceRow?: number;
  state?: string;
  city?: string;
  brand?: string;
  operationStartsAt?: Date;
  operationEndsAt?: Date;
  existingEvidenceKey?: string;
}

export interface ResolvedEntity {
  id: string;
  confidence: number;
  ambiguous?: boolean;
  diagnostics?: Record<string, unknown>;
}

export interface PlannedVisit {
  id: string;
  promoterId: string;
  scheduledDate: Date;
}

export interface ReconciliationDecision {
  result: ReconciliationResult;
  visitId?: string;
  promoterId?: string;
  storeId?: string;
  industryId?: string;
  confidence: number;
  suggestion?: {
    visitId: string;
    plannedDate: string;
    evidenceDate: string;
    distanceDays: number;
    promoterId: string;
    confidence: number;
    sameWeek: boolean;
    outsideOperation: boolean;
  };
  diagnostics?: Record<string, unknown>;
}

export interface ReconciliationSummary {
  total: number;
  matched: number;
  unplanned: number;
  ambiguous: number;
  dateMismatch: number;
  storeNotFound: number;
  industryNotFound: number;
  duplicateEvidence: number;
  promotersIdentified: number;
}
