-- Add workbook fields to slides table for spreadsheet data persistence
ALTER TABLE "slides" ADD COLUMN "workbook_json" TEXT;
ALTER TABLE "slides" ADD COLUMN "workbook_sheet_count" INTEGER;
