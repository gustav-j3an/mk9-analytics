import { z } from 'zod';
import type { ImportFileMetadata } from './ImportPreview';
import type { SpreadsheetType } from './SpreadsheetType';

export const ImportConfirmationPayloadSchema = z.object({
  previewToken: z.string()
    .min(43, 'Token de preview inválido.')
    .max(512, 'Token de preview inválido.')
    .regex(/^[A-Za-z0-9_-]+$/, 'Token de preview inválido.'),
  idempotencyKey: z.string().uuid('Chave de idempotência inválida.'),
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
  status: ImportConfirmationStatus;
  acceptedRows: number;
  rejectedRows: number;
  confirmedAt: string;
}

export type ImportConfirmationErrorCode =
  | 'INVALID_PREVIEW_TOKEN'
  | 'PREVIEW_NOT_FOUND'
  | 'PREVIEW_EXPIRED'
  | 'PREVIEW_ALREADY_USED'
  | 'IDEMPOTENCY_CONFLICT';

export interface ImportConfirmationErrorResponse {
  success: false;
  code: ImportConfirmationErrorCode;
  error: string;
}

export type PreviewConfirmationState = 'PENDING' | 'CONFIRMED' | 'EXPIRED';

/**
 * Server-side record required before a confirmation endpoint can be implemented.
 * It is a contract only; no persistence mechanism is defined here.
 */
export interface ServerPreviewRecord {
  previewId: string;
  importId: string;
  tokenHash: string;
  file: ImportFileMetadata & { hash: string };
  detectedType: SpreadsheetType;
  normalizedDataDigest: string;
  normalizedDataReference: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdAt: string;
  expiresAt: string;
  state: PreviewConfirmationState;
  confirmationId?: string;
  confirmedAt?: string;
  idempotencyKey?: string;
}
