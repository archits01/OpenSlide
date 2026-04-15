-- Change default credits for new users (150 on signup)
ALTER TABLE "users" ALTER COLUMN "credits_balance" SET DEFAULT 150;

-- Track which plan the user is on
ALTER TABLE "users" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'free';

-- Add per-session usage tracking
ALTER TABLE "sessions" ADD COLUMN "credits_used" INT NOT NULL DEFAULT 0;

-- Drop the credit_transactions table (balance lives on users.credits_balance)
DROP TABLE IF EXISTS "credit_transactions";
