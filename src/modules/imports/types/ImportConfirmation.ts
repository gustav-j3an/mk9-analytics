import { z } from 'zod';

export const ImportConfirmationPayloadSchema = z.object({
  previewToken: z.string()
    .min(43, 'Token de preview inválido.')
    .max(512, 'Token de preview inválido.')
    .regex(/^[A-Za-z0-9_-]+$/, 'Token de preview inválido.'),
  idempotencyKey: z.string().uuid('Chave de idempotência inválida.'),
  operationId: z.string().min(1, 'Operação inválida.').max(128, 'Operação inválida.').optional().nullable(),
  industryId: z.string().min(1, 'Indústria inválida.').max(128, 'Indústria inválida.').optional().nullable(),
  month: z.number().int().min(1, 'Mês inválido.').max(12, 'Mês inválido.').optional().nullable(),
  year: z.number().int().min(2000, 'Ano inválido.').max(2100, 'Ano inválido.').optional().nullable(),
  spreadsheetType: z.string().min(1, 'Tipo de planilha inválido.').max(128, 'Tipo de planilha inválido.').optional().nullable(),
  syncMode: z.enum(['FULL_SYNC', 'ADD_ONLY']),
}).strict();

export type ImportConfirmationPayload = z.infer<typeof ImportConfirmationPayloadSchema>;

/** Descriptor to be added to the preview response once a server-side preview store exists. */
export interface PreviewConfirmationDescriptor {
  previewToken: string;
  expiresAt: string;
}

export type ImportConfirmationStatus = 'CONFIRMED' | 'ALREADY_CONFIRMED';

export interface ImportConfirmationResponse {
  success: true;
  confirmationId: string;
  importId: string;
  operationId?: string | null;
  status: ImportConfirmationStatus;
  acceptedRows: number;
  rejectedRows: number;
  confirmedAt: string;
  persistence?: {
    createdStores: number;
    updatedStores: number;
    createdIndustries: number;
    updatedIndustries: number;
    createdPromoters: number;
    updatedPromoters: number;
    createdVisits: number;
    updatedVisits: number;
    ignoredDuplicates: number;
    ignoredInvalidRows: number;
  };
}

export type ImportConfirmationErrorCode =
  | 'INVALID_PREVIEW_TOKEN'
  | 'PREVIEW_NOT_FOUND'
  | 'PREVIEW_EXPIRED'
  | 'PREVIEW_ALREADY_CONSUMED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'OPERATION_NOT_FOUND'
  | 'IMPORT_PERSISTENCE_FAILED';

export interface ImportConfirmationErrorResponse {
  success: false;
  code: ImportConfirmationErrorCode;
  error: string;
}

/**
 * Persisted preview record available to a future confirmation endpoint.
 */
export interface ServerPreviewRecord {
  previewId: string;
  importId: string;
  tokenHash: string;
  fileHash: string;
  dataDigest: string;
  payload: unknown;
  acceptedRows: number;
  rejectedRows: number;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
}
