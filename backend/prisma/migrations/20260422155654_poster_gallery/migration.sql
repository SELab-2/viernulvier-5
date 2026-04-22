-- CreateEnum
CREATE TYPE "filetype" AS ENUM ('video', 'image', 'pdf', 'other');

-- AlterTable
ALTER TABLE "production" ADD COLUMN     "galleryId" UUID;

-- CreateTable
CREATE TABLE "file" (
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

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
