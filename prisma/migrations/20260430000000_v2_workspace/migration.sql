-- V2 Workspace migration: brand kits v2, website mode persistence, sheets workbook, classification.
-- Idempotent (IF NOT EXISTS / DO NOTHING) so it works both for fresh installs and
-- existing self-hosters who may have already applied parts via `prisma db push`.

------------------------------------------------------------------------------
-- Sessions: classification + website + brand-kit linkage + topic
------------------------------------------------------------------------------

ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "presentation_type"        TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "website_files_json"       JSONB;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "website_env_vars"         TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "preview_screenshot_url"   TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "webcontainer_snapshot_url" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "website_sandbox_dirty"    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "website_template_name"    TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "brand_kit_id"             UUID;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "topic_subject"            TEXT;

------------------------------------------------------------------------------
-- BrandKit — v2 brand system. Generated skill files (markdown) + variables.
------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "brand_kits" (
    "id"                 UUID        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"            UUID        NOT NULL,
    "name"               TEXT        NOT NULL,
    "description"        TEXT,
    "is_default"         BOOLEAN     NOT NULL DEFAULT false,
    "domain"             TEXT,
    "layout_cap"         INTEGER     NOT NULL DEFAULT 12,
    "brand_vars"         JSONB       NOT NULL DEFAULT '{}',
    "skill_md"           TEXT,
    "design_system_md"   TEXT,
    "layout_library_md"  TEXT,
    "source_files"       JSONB       NOT NULL DEFAULT '[]',
    "source_notes"       TEXT,
    "status"             TEXT        NOT NULL DEFAULT 'draft',
    "extraction_log"     JSONB       NOT NULL DEFAULT '[]',
    "version"            INTEGER     NOT NULL DEFAULT 1,
    "user_edited_files"  TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_kits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "brand_kits_user_id_idx"            ON "brand_kits"("user_id");
CREATE INDEX IF NOT EXISTS "brand_kits_user_id_is_default_idx" ON "brand_kits"("user_id", "is_default");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'brand_kits_user_id_fkey'
    ) THEN
        ALTER TABLE "brand_kits"
        ADD CONSTRAINT "brand_kits_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

------------------------------------------------------------------------------
-- BrandKitVersion — append-only history of brand-kit edits / re-extracts.
------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "brand_kit_versions" (
    "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
    "brand_kit_id"      UUID        NOT NULL,
    "version"           INTEGER     NOT NULL,
    "brand_vars"        JSONB       NOT NULL,
    "skill_md"          TEXT,
    "design_system_md"  TEXT,
    "layout_library_md" TEXT,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_reason"     TEXT,

    CONSTRAINT "brand_kit_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "brand_kit_versions_brand_kit_id_version_idx"
    ON "brand_kit_versions"("brand_kit_id", "version");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'brand_kit_versions_brand_kit_id_fkey'
    ) THEN
        ALTER TABLE "brand_kit_versions"
        ADD CONSTRAINT "brand_kit_versions_brand_kit_id_fkey"
        FOREIGN KEY ("brand_kit_id") REFERENCES "brand_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

------------------------------------------------------------------------------
-- Session FK to brand_kits (added after both tables exist).
------------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sessions_brand_kit_id_fkey'
    ) THEN
        ALTER TABLE "sessions"
        ADD CONSTRAINT "sessions_brand_kit_id_fkey"
        FOREIGN KEY ("brand_kit_id") REFERENCES "brand_kits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;
