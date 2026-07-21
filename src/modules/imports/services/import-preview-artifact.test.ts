import assert from 'node:assert/strict';
import test from 'node:test';
import { SpreadsheetType } from '../types/SpreadsheetType';
import { SOURCE_ROW_NUMBER } from '../types/ImportPreview';
import type { NormalizedImportRow } from '../types/ImportPreview';
import {
  PREVIEW_DURATION_MS,
  buildPreviewArtifact,
  createDataDigest,
  createPreviewDescriptor,
} from './ImportPreviewArtifactService';
import type { PreviewArtifactPayload } from './ImportPreviewArtifactService';

function createInput() {
  const validRow: NormalizedImportRow = {
    INDUSTRIA: 'Indústria A',
    LOJA: 'Loja A',
    UF: 'DF',
    VISITA_SEMANAL: 1,
    [SOURCE_ROW_NUMBER]: 7,
  };

  return {
    importId: 'import-1',
    file: {
      name: 'roteiro.xlsx',
      size: 4,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    fileBytes: new Uint8Array([1, 2, 3, 4]).buffer,
    detectedType: SpreadsheetType.DESCONHECIDO,
    sheets: ['Roteiro'],
    columns: ['INDUSTRIA', 'LOJA', 'UF', 'VISITA_SEMANAL'],
    confirmableRows: [validRow],
    totalRows: 2,
    validRows: 1,
    invalidRows: 1,
    duplicateRows: 0,
    totalVisitsDetected: 1,
    dateColumnCount: 1,
    rowsWithVisits: 1,
    errors: [{ row: 8, field: 'LOJA', message: 'LOJA: campo obrigatório não preenchido.' }],
    warnings: ['1 linha inválida não foi incluída na amostra.'],
    now: new Date('2026-07-18T12:00:00.000Z'),
  };
}

test('retorna token puro uma vez, mas não o inclui nos dados persistidos', () => {
  const artifact = buildPreviewArtifact(createInput());
  assert.equal(artifact.previewToken.length, 43);
  assert.equal('previewToken' in artifact.data, false);
  assert.notEqual(artifact.data.tokenHash, artifact.previewToken);
});

test('gera tokenHash diferente para tokens diferentes', () => {
  const first = buildPreviewArtifact(createInput());
  const second = buildPreviewArtifact(createInput());
  assert.notEqual(first.data.tokenHash, second.data.tokenHash);
});

test('define expiresAt trinta minutos no futuro', () => {
  const input = createInput();
  const artifact = buildPreviewArtifact(input);
  assert.equal(artifact.expiresAt.getTime(), input.now.getTime() + PREVIEW_DURATION_MS);
});

test('gera digest estável para os mesmos dados independentemente da ordem das chaves', () => {
  const first = createDataDigest([{ INDUSTRIA: 'A', LOJA: 'B' }]);
  const second = createDataDigest([{ LOJA: 'B', INDUSTRIA: 'A' }]);
  assert.equal(first, second);
});

test('payload contém somente linhas confirmáveis e auditoria completa', () => {
  const artifact = buildPreviewArtifact(createInput());
  const payload = artifact.data.payload as unknown as PreviewArtifactPayload;
  assert.equal(payload.rows.length, 1);
  assert.equal(payload.rows[0].sourceRow, 7);
  assert.equal('sourceRow' in payload.rows[0].data, false);
  assert.deepEqual(payload.audit, {
    totalRows: 2,
    validRows: 1,
    invalidRows: 1,
    duplicateRows: 0,
    totalVisitsDetected: 1,
    dateColumnCount: 1,
    rowsWithVisits: 1,
    errors: [{ row: 8, field: 'LOJA', message: 'LOJA: campo obrigatório não preenchido.' }],
    warnings: ['1 linha inválida não foi incluída na amostra.'],
    deduplicationCriterion: 'FULL_NORMALIZED_ROW_JSON',
  });
});

test('descritor público não expõe hash nem payload do artefato', () => {
  const descriptor = createPreviewDescriptor(buildPreviewArtifact(createInput()));
  assert.deepEqual(Object.keys(descriptor).sort(), ['expiresAt', 'previewToken']);
});

test('preview sem linhas confirmáveis não produz artefato', () => {
  const input = createInput();
  assert.throws(
    () => buildPreviewArtifact({ ...input, confirmableRows: [] }),
    /não possui linhas válidas/,
  );
});
