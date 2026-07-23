ALTER TABLE "Visit"
ADD COLUMN "routeOrder" INTEGER,
ADD COLUMN "weeklyFrequency" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "plannedTime" TEXT,
ADD COLUMN "estimatedDurationMinutes" INTEGER,
ADD COLUMN "notes" TEXT,
ADD COLUMN "manualOverrideReason" TEXT;

CREATE INDEX "Visit_operationId_promoterId_scheduledDate_routeOrder_idx"
ON "Visit"("operationId", "promoterId", "scheduledDate", "routeOrder");
