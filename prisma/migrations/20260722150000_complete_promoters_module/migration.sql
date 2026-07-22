CREATE TYPE "PromoterStatus" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "Promoter" ADD COLUMN "phone" TEXT, ADD COLUMN "email" TEXT, ADD COLUMN "status" "PromoterStatus" NOT NULL DEFAULT 'ACTIVE', ADD COLUMN "archivedAt" TIMESTAMP(3), ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "operationId" TEXT;
CREATE INDEX "Promoter_operationId_idx" ON "Promoter"("operationId");
ALTER TABLE "Promoter" ADD CONSTRAINT "Promoter_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
