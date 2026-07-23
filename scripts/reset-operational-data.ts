import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';
import {
  OPERATIONAL_MODELS,
  PRESERVED_TABLES,
  assertResetAuthorized,
  collectOperationalCounts,
  collectPreservedCounts,
  identifyResetEnvironment,
  resetOperationalData,
  type OperationalDataClient,
} from '../src/modules/admin/OperationalDataReset';

const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const backupOnly = args.has('--backup-only');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL não está definida.');

const environment = identifyResetEnvironment(databaseUrl);
const client = prisma as unknown as OperationalDataClient;

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('T', '-');
}

async function safeUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

async function migrationCount(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations"
  `;
  return Number(rows[0]?.count ?? 0);
}

async function createJsonBackup(): Promise<string> {
  const directory = path.resolve('backups', `mk9-before-operational-reset-${timestamp()}`);
  await fs.mkdir(directory, { recursive: true });
  const manifest: Record<string, { file: string; records: number }> = {};
  const backupModels = ['user', ...OPERATIONAL_MODELS] as const;
  for (const model of backupModels) {
    const rows = await client[model].findMany();
    const file = `${model}.json`;
    await fs.writeFile(path.join(directory, file), JSON.stringify(rows, null, 2), { encoding: 'utf8', flag: 'wx' });
    const stat = await fs.stat(path.join(directory, file));
    if (stat.size === 0) throw new Error(`Backup inválido: ${file} está vazio.`);
    manifest[model] = { file, records: rows.length };
  }
  const migrations = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT * FROM "_prisma_migrations" ORDER BY "started_at" ASC
  `;
  await fs.writeFile(
    path.join(directory, '_prisma_migrations.json'),
    JSON.stringify(migrations, (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2),
    { encoding: 'utf8', flag: 'wx' },
  );
  manifest._prisma_migrations = { file: '_prisma_migrations.json', records: migrations.length };
  await fs.writeFile(
    path.join(directory, 'manifest.json'),
    JSON.stringify({ createdAt: new Date().toISOString(), environment, tables: manifest }, null, 2),
    { encoding: 'utf8', flag: 'wx' },
  );
  const files = await fs.readdir(directory);
  if (!files.includes('manifest.json') || files.length !== backupModels.length + 2) {
    throw new Error('Backup inválido: conjunto de arquivos incompleto.');
  }
  return directory;
}

async function report() {
  const [operational, preserved, users, migrations] = await Promise.all([
    collectOperationalCounts(client),
    collectPreservedCounts(client),
    safeUsers(),
    migrationCount(),
  ]);
  console.info(JSON.stringify({
    mode: execute ? 'execute' : backupOnly ? 'backup-only' : 'dry-run',
    environment,
    deletionOrder: OPERATIONAL_MODELS,
    operational,
    preserved: { ...preserved, migrations, tables: PRESERVED_TABLES, users },
  }, null, 2));
  return { operational, preserved, migrations };
}

async function main() {
  await report();
  if (!execute && !backupOnly) {
    console.info('DRY-RUN concluído: nenhum registro foi alterado.');
    return;
  }
  if (backupOnly) {
    const backupPath = await createJsonBackup();
    console.info(`Backup validado: ${backupPath}`);
    return;
  }
  assertResetAuthorized(environment, process.env);
  const backupPath = await createJsonBackup();
  console.info(`Backup pré-reset validado: ${backupPath}`);
  const result = await resetOperationalData(client);
  const preservedAfter = await collectPreservedCounts(client);
  const migrationsAfter = await migrationCount();
  console.info(JSON.stringify({ result, preservedAfter, migrationsAfter }, null, 2));
}

void main().finally(() => prisma.$disconnect());
