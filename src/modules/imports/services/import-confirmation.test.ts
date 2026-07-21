import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { hashSha256 } from './ImportPreviewArtifactService';
import { confirmImportPreview, ImportConfirmationError, type ArtifactRecord, type ConfirmationRecord, type ConfirmationStore, type ConfirmationTransaction } from './ImportConfirmationService';

const tokenA = randomBytes(32).toString('base64url');
const tokenB = randomBytes(32).toString('base64url');
const keyA = '550e8400-e29b-41d4-a716-446655440000';
const keyB = '550e8400-e29b-41d4-a716-446655440001';
const now = new Date('2026-07-18T20:00:00.000Z');

function artifact(id: string, token: string, expiresAt = new Date('2026-07-18T20:30:00.000Z')): ArtifactRecord {
  return { id, importId: `import-${id}`, tokenHash: hashSha256(token), fileHash: `hash-${id}`, payload: {}, acceptedRows: 3, rejectedRows: 1, expiresAt, consumedAt: null };
}

class MemoryStore implements ConfirmationStore {
  artifacts = new Map<string, ArtifactRecord>();
  confirmations = new Map<string, ConfirmationRecord>();
  failCreate = false;
  operationalWrites = 0;

  async transaction<T>(work: (transaction: ConfirmationTransaction) => Promise<T>): Promise<T> {
    const artifactsSnapshot = structuredClone(this.artifacts);
    const confirmationsSnapshot = structuredClone(this.confirmations);
    const writesSnapshot = this.operationalWrites;
    try { return await work(this.transactionClient()); } catch (error) {
      this.artifacts = artifactsSnapshot;
      this.confirmations = confirmationsSnapshot;
      this.operationalWrites = writesSnapshot;
      throw error;
    }
  }
  async findConfirmationByKey(key: string) { return this.confirmations.get(key) ?? null; }
  async findConfirmationByArtifact(artifactId: string) { return [...this.confirmations.values()].find((item) => item.previewArtifactId === artifactId) ?? null; }
  async findArtifactByTokenHash(tokenHash: string) { return [...this.artifacts.values()].find((item) => item.tokenHash === tokenHash) ?? null; }

  private transactionClient(): ConfirmationTransaction {
    return {
      findConfirmationByKey: (key) => this.findConfirmationByKey(key),
      findConfirmationByArtifact: (artifactId) => this.findConfirmationByArtifact(artifactId),
      findArtifactByTokenHash: (tokenHash) => this.findArtifactByTokenHash(tokenHash),
      consumeArtifact: async (artifactId, consumedAt) => {
        const item = this.artifacts.get(artifactId);
        if (!item || item.consumedAt || item.expiresAt <= consumedAt) return false;
        item.consumedAt = consumedAt;
        return true;
      },
      persistArtifact: async () => {
        this.operationalWrites += 1;
        return { createdStores: 1, updatedStores: 0, createdIndustries: 1, updatedIndustries: 0, createdPromoters: 0, updatedPromoters: 0, createdVisits: 3, updatedVisits: 0, ignoredDuplicates: 0, ignoredInvalidRows: 1 };
      },
      createConfirmation: async (input) => {
        if (this.failCreate) throw new Error('falha simulada');
        const source = this.artifacts.get(input.previewArtifactId);
        if (!source) throw new Error('artefato ausente');
        const record: ConfirmationRecord = { id: `confirmation-${this.confirmations.size + 1}`, ...input, previewArtifact: { tokenHash: source.tokenHash } };
        this.confirmations.set(input.idempotencyKey, record);
        return record;
      },
    };
  }
}

async function expectError(promise: Promise<unknown>, code: string, status: number) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof ImportConfirmationError);
    assert.equal(error.code, code);
    assert.equal(error.httpStatus, status);
    return true;
  });
}

test('confirma preview válido com persistência operacional', async () => {
  const store = new MemoryStore();
  store.artifacts.set('a', artifact('a', tokenA));
  const result = await confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, store, now);
  assert.equal(result.status, 'CONFIRMED');
  assert.equal(result.acceptedRows, 3);
  assert.equal(result.rejectedRows, 1);
  assert.equal(store.operationalWrites, 1);
  assert.equal(result.persistence?.createdVisits, 3);
});

test('rejeita token inexistente com 404', async () => {
  await expectError(confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, new MemoryStore(), now), 'PREVIEW_NOT_FOUND', 404);
});

test('rejeita token expirado com 410', async () => {
  const store = new MemoryStore();
  store.artifacts.set('a', artifact('a', tokenA, new Date('2026-07-18T19:59:59.000Z')));
  await expectError(confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, store, now), 'PREVIEW_EXPIRED', 410);
});

test('repete mesma chave e preview como ALREADY_CONFIRMED', async () => {
  const store = new MemoryStore();
  store.artifacts.set('a', artifact('a', tokenA));
  await confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, store, now);
  assert.equal((await confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, store, now)).status, 'ALREADY_CONFIRMED');
  assert.equal(store.operationalWrites, 1);
});

test('rejeita mesma chave em outro preview', async () => {
  const store = new MemoryStore();
  store.artifacts.set('a', artifact('a', tokenA));
  store.artifacts.set('b', artifact('b', tokenB));
  await confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, store, now);
  await expectError(confirmImportPreview({ previewToken: tokenB, idempotencyKey: keyA }, store, now), 'IDEMPOTENCY_CONFLICT', 409);
});

test('rejeita preview consumido com chave diferente', async () => {
  const store = new MemoryStore();
  store.artifacts.set('a', artifact('a', tokenA));
  await confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, store, now);
  await expectError(confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyB }, store, now), 'PREVIEW_ALREADY_CONSUMED', 409);
});

test('reverte consumedAt quando a criação da confirmação falha', async () => {
  const store = new MemoryStore();
  store.artifacts.set('a', artifact('a', tokenA));
  store.failCreate = true;
  await assert.rejects(confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, store, now));
  assert.equal(store.artifacts.get('a')?.consumedAt, null);
  assert.equal(store.confirmations.size, 0);
});

test('reverte persistência operacional quando a confirmação falha', async () => {
  const store = new MemoryStore();
  store.artifacts.set('a', artifact('a', tokenA));
  store.failCreate = true;
  await assert.rejects(confirmImportPreview({ previewToken: tokenA, idempotencyKey: keyA }, store, now));
  assert.equal(store.operationalWrites, 0);
});
