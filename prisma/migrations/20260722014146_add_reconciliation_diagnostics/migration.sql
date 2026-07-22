-- AlterTable
ALTER TABLE "VisitEvidence" ADD COLUMN     "diagnostics" JSONB,
ADD COLUMN     "rawBrand" TEXT,
ADD COLUMN     "rawCity" TEXT,
ADD COLUMN     "rawState" TEXT,
ADD COLUMN     "suggestion" JSONB;
