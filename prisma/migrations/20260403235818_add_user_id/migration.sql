-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
