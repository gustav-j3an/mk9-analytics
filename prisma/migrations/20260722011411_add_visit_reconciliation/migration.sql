-- CreateEnum
CREATE TYPE "ReconciliationResult" AS ENUM ('MATCHED', 'UNPLANNED', 'AMBIGUOUS', 'DATE_MISMATCH', 'STORE_NOT_FOUND', 'INDUSTRY_NOT_FOUND', 'DUPLICATE_EVIDENCE');

-- CreateTable
CREATE TABLE "StoreAlias" (
    "id" TEXT NOT NULL,
    "aliasKey" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryAlias" (
    "id" TEXT NOT NULL,
    "aliasKey" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitEvidence" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "visitId" TEXT,
    "storeId" TEXT,
    "industryId" TEXT,
    "evidenceDate" TIMESTAMP(3) NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "sourceSheet" TEXT,
    "sourceRow" INTEGER,
    "rawStoreName" TEXT NOT NULL,
    "rawIndustryName" TEXT NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "result" "ReconciliationResult" NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationAudit" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreAlias_aliasKey_key" ON "StoreAlias"("aliasKey");

-- CreateIndex
CREATE INDEX "StoreAlias_storeId_idx" ON "StoreAlias"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryAlias_aliasKey_key" ON "IndustryAlias"("aliasKey");

-- CreateIndex
CREATE INDEX "IndustryAlias_industryId_idx" ON "IndustryAlias"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitEvidence_deduplicationKey_key" ON "VisitEvidence"("deduplicationKey");

-- CreateIndex
CREATE INDEX "VisitEvidence_operationId_evidenceDate_idx" ON "VisitEvidence"("operationId", "evidenceDate");

-- CreateIndex
CREATE INDEX "VisitEvidence_visitId_idx" ON "VisitEvidence"("visitId");

-- CreateIndex
CREATE INDEX "VisitEvidence_result_idx" ON "VisitEvidence"("result");

-- CreateIndex
CREATE INDEX "ReconciliationAudit_evidenceId_idx" ON "ReconciliationAudit"("evidenceId");

-- AddForeignKey
ALTER TABLE "StoreAlias" ADD CONSTRAINT "StoreAlias_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryAlias" ADD CONSTRAINT "IndustryAlias_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitEvidence" ADD CONSTRAINT "VisitEvidence_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitEvidence" ADD CONSTRAINT "VisitEvidence_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitEvidence" ADD CONSTRAINT "VisitEvidence_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitEvidence" ADD CONSTRAINT "VisitEvidence_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitEvidence" ADD CONSTRAINT "VisitEvidence_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationAudit" ADD CONSTRAINT "ReconciliationAudit_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "VisitEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
