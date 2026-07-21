import { createHash, randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { SpreadsheetType } from '../types/SpreadsheetType';
import type { PreviewConfirmationDescriptor } from '../types/ImportConfirmation';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type {
  ImportFileMetadata,
  ImportValidationError,
  NormalizedImportRow,
} from '../types/ImportPreview';

export const PREVIEW_DURATION_MS = 30 * 60 * 1000;
export const DEDUPLICATION_CRITERION = 'FULL_NORMALIZED_ROW_JSON' as const;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

export interface PreviewArtifactPayload extends JsonObject {
  version: 1;
  file: JsonObject;
  detectedType: string;
  sheets: string[];
  columns: string[];
  rows: Array<{ sourceRow: number | null; data: JsonObject }>;
  audit: JsonObject;
}

interface BuildPreviewArtifactInput {
  importId: string;
  file: ImportFileMetadata;
  fileBytes: ArrayBuffer;
  detectedType: SpreadsheetType;
  sheets: string[];
  columns: string[];
  confirmableRows: NormalizedImportRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  totalVisitsDetected: number;
  errors: ImportValidationError[];
  warnings: string[];
  now?: Date;
}

export interface BuiltPreviewArtifact {
  previewToken: string;
  expiresAt: Date;
  data: Prisma.ImportPreviewArtifactUncheckedCreateInput;
}

export function createPreviewDescriptor(artifact: BuiltPreviewArtifact): PreviewConfirmationDescriptor {
  return {
    previewToken: artifact.previewToken,
    expiresAt: artifact.expiresAt.toISOString(),
  };
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toJsonValue(entry)]),
    );
  }
  return String(value ?? '');
}

function canonicalize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function hashSha256(value: string | ArrayBuffer): string {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : Buffer.from(value))
    .digest('hex');
}

export function createDataDigest(rows: JsonObject[]): string {
  return hashSha256(JSON.stringify(canonicalize(rows)));
}

export function assertHasConfirmableRows(rows: NormalizedImportRow[]): void {
  if (rows.length === 0) {
    throw new Error('O arquivo não possui linhas válidas para confirmação.');
  }
}

export function buildPreviewArtifact(input: BuildPreviewArtifactInput): BuiltPreviewArtifact {
  assertHasConfirmableRows(input.confirmableRows);

  const previewToken = randomBytes(32).toString('base64url');
  const tokenHash = hashSha256(previewToken);
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + PREVIEW_DURATION_MS);
  const rows = input.confirmableRows.map((row) => ({
    sourceRow: row[SOURCE_ROW_NUMBER] ?? null,
    data: toJsonValue(row) as JsonObject,
  }));
  const errors = input.errors.map(({ row, field, message }) => ({ row, field, message }));
  const fileHash = hashSha256(input.fileBytes);
  const payload: PreviewArtifactPayload = {
    version: 1,
    file: {
      name: input.file.name,
      size: input.file.size,
      type: input.file.type,
      hash: fileHash,
    },
    detectedType: input.detectedType,
    sheets: input.sheets,
    columns: input.columns,
    rows,
    audit: {
      totalRows: input.totalRows,
      validRows: input.validRows,
      invalidRows: input.invalidRows,
      duplicateRows: input.duplicateRows,
      totalVisitsDetected: input.totalVisitsDetected,
      errors: toJsonValue(errors),
      warnings: input.warnings,
      deduplicationCriterion: DEDUPLICATION_CRITERION,
    },
  };
  return {
    previewToken,
    expiresAt,
    data: {
      importId: input.importId,
      tokenHash,
      fileHash,
      dataDigest: createDataDigest(rows.map((row) => row.data)),
      payload: payload as Prisma.InputJsonValue,
      acceptedRows: rows.length,
      rejectedRows: input.invalidRows,
      expiresAt,
    },
  };
}
