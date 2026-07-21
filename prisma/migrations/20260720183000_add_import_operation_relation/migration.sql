-- A coluna nullable preserva importacoes existentes sem vinculo.
ALTER TABLE "Import" ADD COLUMN "operationId" TEXT;

CREATE INDEX "Import_operationId_idx" ON "Import"("operationId");

ALTER TABLE "Import"
ADD CONSTRAINT "Import_operationId_fkey"
FOREIGN KEY ("operationId") REFERENCES "Operation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
