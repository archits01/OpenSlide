-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Presentation',
    "logo_url" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slides" (
    "id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'content',
    "theme" TEXT,
    "notes" TEXT,
    "session_id" TEXT NOT NULL,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlines" (
    "id" TEXT NOT NULL,
    "presentation_title" TEXT NOT NULL,
    "slides" JSONB NOT NULL,
    "session_id" TEXT NOT NULL,

    CONSTRAINT "outlines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_updated_at_idx" ON "sessions"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "slides_session_id_idx" ON "slides"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "outlines_session_id_key" ON "outlines"("session_id");

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlines" ADD CONSTRAINT "outlines_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
