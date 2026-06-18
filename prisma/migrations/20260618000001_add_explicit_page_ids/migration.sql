-- Add explicit_page_ids column to roles table
ALTER TABLE "roles" ADD COLUMN "explicit_page_ids" INTEGER[] NOT NULL DEFAULT '{}';
