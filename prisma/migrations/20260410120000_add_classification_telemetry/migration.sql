-- Add classification telemetry fields to sessions table
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "slide_category" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "deck_density" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "classification_confidence" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "classification_method" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "classified_at" TIMESTAMP(3);

-- Create classification_events table for analytics
CREATE TABLE IF NOT EXISTS "classification_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "prompt_length" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classification_events_pkey" PRIMARY KEY ("id")
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS "classification_events_created_at_idx" ON "classification_events"("created_at");
CREATE INDEX IF NOT EXISTS "classification_events_category_idx" ON "classification_events"("category");
