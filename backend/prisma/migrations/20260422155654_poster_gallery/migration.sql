-- Keep this migration idempotent because these objects may already exist
-- from previous merged migrations.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'filetype') THEN
        CREATE TYPE "filetype" AS ENUM ('video', 'image', 'pdf', 'other');
    END IF;
END $$;

ALTER TABLE "production" ADD COLUMN IF NOT EXISTS "galleryId" UUID;

CREATE TABLE IF NOT EXISTS "file" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR,
    "description" VARCHAR,
    "gallery_id" UUID,
    "file_location" TEXT,
    "type" "filetype",

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'file_gallery_id_fkey') THEN
        ALTER TABLE "file"
            ADD CONSTRAINT "file_gallery_id_fkey"
            FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_galleryId_fkey') THEN
        ALTER TABLE "production"
            ADD CONSTRAINT "production_galleryId_fkey"
            FOREIGN KEY ("galleryId") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
