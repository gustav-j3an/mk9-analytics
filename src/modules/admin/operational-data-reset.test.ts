import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OPERATIONAL_MODELS,
  PRESERVED_TABLES,
  assertResetAuthorized,
  collectOperationalCounts,
  identifyResetEnvironment,
  resetOperationalData,
  type OperationalDataClient,
  type OperationalModel,
} from './OperationalDataReset';

function fakeClient(initial = 2): OperationalDataClient & { rows: Record<string, number>; calls: string[] } {
  const rows: Record<string, number> = Object.fromEntries([...OPERATIONAL_MODELS, 'user'].map((model) => [model, initial]));
  const calls: string[] = [];
  const client = { rows, calls } as unknown as OperationalDataClient & { rows: Record<string, number>; calls: string[] };
  for (const model of [...OPERATIONAL_MODELS, 'user'] as const) {
    client[model] = {
      count: async () => rows[model],
      findMany: async () => Array.from({ length: rows[model] }, (_, id) => ({ id })),
      deleteMany: async () => {
        calls.push(model);
        const count = rows[model];
        rows[model] = 0;
        return { count };
      },
    };
  }
  client.$transaction = async (work) => {
    const snapshot = { ...rows };
    try {
      return await work(client);
    } catch (error) {
      Object.assign(rows, snapshot);
      throw error;
    }
  };
  return client;
}

test('dry-run coleta contagens sem apagar dados', async () => {
  const client = fakeClient();
  const counts = await collectOperationalCounts(client);
  assert.equal(counts.visit, 2);
  assert.deepEqual(client.calls, []);
});

test('execução sem chave de confirmação é bloqueada', () => {
  const environment = identifyResetEnvironment('postgresql://u:p@localhost:5432/db');
  assert.throws(() => assertResetAuthorized(environment, {}), /CONFIRM_OPERATIONAL_RESET/);
});

test('Neon não classificado exige a segunda confirmação', () => {
  const environment = identifyResetEnvironment('postgresql://u:p@ep-example-pooler.us-east-1.aws.neon.tech/db');
  assert.equal(environment.kind, 'neon-unclassified');
  assert.throws(
    () => assertResetAuthorized(environment, { CONFIRM_OPERATIONAL_RESET: 'DELETE_TEST_DATA' }),
    /ALLOW_PRODUCTION_DATA_RESET/,
  );
});

test('usuários, migrations e tabelas não autorizadas são preservados', async () => {
  const client = fakeClient();
  await resetOperationalData(client);
  assert.equal(client.rows.user, 2);
  assert.deepEqual(PRESERVED_TABLES, ['User', '_prisma_migrations']);
  assert.equal(client.calls.includes('user'), false);
  assert.deepEqual(client.calls, [...OPERATIONAL_MODELS]);
});

test('dados operacionais são removidos e execução repetida é idempotente', async () => {
  const client = fakeClient();
  const first = await resetOperationalData(client);
  const second = await resetOperationalData(client);
  assert.equal(Object.values(first.after).every((count) => count === 0), true);
  assert.equal(Object.values(second.deleted).every((count) => count === 0), true);
});

test('banco operacional vazio não gera erro', async () => {
  const client = fakeClient(0);
  const result = await resetOperationalData(client);
  assert.equal(Object.values(result.after).every((count) => count === 0), true);
});

test('falha intermediária reverte todas as exclusões', async () => {
  const client = fakeClient();
  await assert.rejects(
    resetOperationalData(client, { failAfterModel: 'visit' as OperationalModel }),
    /Falha simulada/,
  );
  assert.equal(OPERATIONAL_MODELS.every((model) => client.rows[model] === 2), true);
  assert.equal(client.rows.user, 2);
});
