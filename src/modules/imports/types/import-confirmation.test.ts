import assert from 'node:assert/strict';
import test from 'node:test';
import { ImportConfirmationPayloadSchema } from './ImportConfirmation';

const validPayload = {
  previewToken: '7bYx_DjWQ9zBvE8KL0fMb2uT4SrP6nHcXaG1eZiA5Qo',
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
};

test('aceita token de preview e chave de idempotência válidos', () => {
  const result = ImportConfirmationPayloadSchema.safeParse(validPayload);
  assert.equal(result.success, true);
});

test('rejeita payload sem token de preview', () => {
  const result = ImportConfirmationPayloadSchema.safeParse({
    idempotencyKey: validPayload.idempotencyKey,
  });
  assert.equal(result.success, false);
});

test('rejeita chave de idempotência inválida', () => {
  const result = ImportConfirmationPayloadSchema.safeParse({
    previewToken: validPayload.previewToken,
    idempotencyKey: 'repetir-importacao',
  });
  assert.equal(result.success, false);
});

test('rejeita linhas reenviadas pelo navegador', () => {
  const result = ImportConfirmationPayloadSchema.safeParse({
    ...validPayload,
    rows: [{ LOJA: 'valor alterado' }],
  });
  assert.equal(result.success, false);
});
