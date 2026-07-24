export const ROUTE_SCHEMA_MESSAGE = 'O banco de dados ainda não recebeu a atualização necessária para este módulo.';

export function prismaErrorCode(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  return typeof error.code === 'string' ? error.code : null;
}

export function isRouteSchemaMismatch(error: unknown) {
  return prismaErrorCode(error) === 'P2022';
}

export function logRouteServerError(operation: string, request: string, error: unknown) {
  console.error('[routes:server]', {
    module: 'routes',
    operation,
    request,
    timestamp: new Date().toISOString(),
    prismaCode: prismaErrorCode(error),
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
