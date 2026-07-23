import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { prisma } from './src/lib/prisma';
import { buildPreviewArtifact } from './src/modules/imports/services/ImportPreviewArtifactService';
import { SpreadsheetType } from './src/modules/imports/types/SpreadsheetType';
import { confirmImportPreview } from './src/modules/imports/services/ImportConfirmationService';

async function main() {
  const fileBytes = new Uint8Array([1, 2, 3]).buffer;
  const importRecord = await prisma.import.create({ data: { status: 'PROCESSING' } });
  const artifact = buildPreviewArtifact({
    importId: importRecord.id,
    file: { name: 'test.xlsx', size: 3, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    fileBytes,
    detectedType: SpreadsheetType.KING_CHECKLIST,
    sheets: ['Sheet1'],
    columns: ['1_7_2026', 'LOJA', 'INDUSTRIA', 'PROMOTOR'],
    confirmableRows: [
      {
        LOJA: 'Loja Teste',
        INDUSTRIA: 'Industria Teste',
        PROMOTOR: 'Promotor Teste',
        '1_7_2026': 'X',
      },
    ],
    totalRows: 1,
    validRows: 1,
    invalidRows: 0,
    duplicateRows: 0,
    totalVisitsDetected: 1,
    dateColumnCount: 1,
    rowsWithVisits: 1,
    errors: [],
    warnings: [],
  });
  await prisma.importPreviewArtifact.create({ data: artifact.data });
  const previewToken = artifact.previewToken;
  const idempotencyKey = '550e8400-e29b-41d4-a716-446655440001';
  try {
    const result = await confirmImportPreview({ previewToken, idempotencyKey }, undefined, new Date());
    console.log('RESULT', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('ERROR', error);
    if (error instanceof Error) {
      console.error('name', error.name);
      console.error('message', error.message);
      console.error('stack', error.stack);
      console.error('code', (error as any).code);
      console.error('meta', (error as any).meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('UNCAUGHT', error);
  process.exit(1);
});
