export const OPERATIONAL_MODELS = [
  'reconciliationAudit',
  'importConfirmation',
  'visitEvidence',
  'visit',
  'storeAlias',
  'industryAlias',
  'importFile',
  'importPreviewArtifact',
  'import',
  'promoter',
  'supervisor',
  'store',
  'industry',
  'operation',
  'syncLog',
] as const;

export const PRESERVED_TABLES = ['User', '_prisma_migrations'] as const;

export type OperationalModel = (typeof OPERATIONAL_MODELS)[number];
export type OperationalCounts = Record<OperationalModel, number>;

interface ModelDelegate {
  count(): Promise<number>;
  findMany(): Promise<unknown[]>;
  deleteMany(): Promise<{ count: number }>;
}

export type OperationalDataClient = Record<OperationalModel, ModelDelegate> & {
  user: Pick<ModelDelegate, 'count' | 'findMany'>;
  $transaction<T>(work: (tx: OperationalDataClient) => Promise<T>): Promise<T>;
};

export interface ResetEnvironment {
  kind: 'local' | 'neon-development' | 'neon-preview' | 'neon-production' | 'neon-unclassified' | 'remote-unclassified';
  database: string;
  maskedHost: string;
  pooled: boolean;
  requiresProductionConfirmation: boolean;
}

export function identifyResetEnvironment(databaseUrl: string, nodeEnv = process.env.NODE_ENV): ResetEnvironment {
  const url = new URL(databaseUrl);
  const host = url.hostname;
  const lowerHost = host.toLowerCase();
  const isNeon = lowerHost.endsWith('.neon.tech');
  const explicitlyProduction = nodeEnv === 'production' || /(^|[-.])(prod|production)([-.]|$)/.test(lowerHost);
  const explicitlyPreview = /(^|[-.])(preview|staging)([-.]|$)/.test(lowerHost);
  const explicitlyDevelopment = /(^|[-.])(dev|development)([-.]|$)/.test(lowerHost);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(lowerHost);
  const kind: ResetEnvironment['kind'] = isLocal
    ? 'local'
    : isNeon && explicitlyProduction
      ? 'neon-production'
      : isNeon && explicitlyPreview
        ? 'neon-preview'
        : isNeon && explicitlyDevelopment
          ? 'neon-development'
          : isNeon
            ? 'neon-unclassified'
            : 'remote-unclassified';
  const visibleStart = host.slice(0, Math.min(6, host.length));
  const visibleEnd = host.slice(Math.max(visibleStart.length, host.length - 12));
  return {
    kind,
    database: url.pathname.replace(/^\//, '') || '(default)',
    maskedHost: `${visibleStart}***${visibleEnd}`,
    pooled: lowerHost.includes('-pooler.'),
    requiresProductionConfirmation: explicitlyProduction || kind === 'neon-unclassified' || kind === 'remote-unclassified',
  };
}

export function assertResetAuthorized(
  environment: ResetEnvironment,
  variables: Record<string, string | undefined>,
): void {
  if (variables.CONFIRM_OPERATIONAL_RESET !== 'DELETE_TEST_DATA') {
    throw new Error('Reset bloqueado: defina CONFIRM_OPERATIONAL_RESET=DELETE_TEST_DATA.');
  }
  if (environment.requiresProductionConfirmation && variables.ALLOW_PRODUCTION_DATA_RESET !== 'true') {
    throw new Error('Reset bloqueado: este ambiente exige ALLOW_PRODUCTION_DATA_RESET=true.');
  }
}

export async function collectOperationalCounts(client: OperationalDataClient): Promise<OperationalCounts> {
  const entries = await Promise.all(
    OPERATIONAL_MODELS.map(async (model) => [model, await client[model].count()] as const),
  );
  return Object.fromEntries(entries) as OperationalCounts;
}

export async function collectPreservedCounts(client: OperationalDataClient): Promise<{ user: number }> {
  return { user: await client.user.count() };
}

export async function resetOperationalData(
  client: OperationalDataClient,
  options: { failAfterModel?: OperationalModel } = {},
): Promise<{ before: OperationalCounts; after: OperationalCounts; deleted: OperationalCounts }> {
  const before = await collectOperationalCounts(client);
  const deleted = Object.fromEntries(OPERATIONAL_MODELS.map((model) => [model, 0])) as OperationalCounts;
  await client.$transaction(async (tx) => {
    for (const model of OPERATIONAL_MODELS) {
      deleted[model] = (await tx[model].deleteMany()).count;
      if (options.failAfterModel === model) throw new Error(`Falha simulada após ${model}.`);
    }
  });
  const after = await collectOperationalCounts(client);
  return { before, after, deleted };
}
