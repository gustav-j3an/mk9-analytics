import { ReconciliationDiagnosticService } from '@/modules/reconciliation/ReconciliationDiagnosticService';

export async function GET(request: Request) {
  const operationId = new URL(request.url).searchParams.get('operationId') ?? undefined;
  const report = await ReconciliationDiagnosticService.report(operationId);
  return Response.json(report);
}
