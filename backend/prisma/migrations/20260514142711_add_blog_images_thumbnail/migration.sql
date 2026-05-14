/*
  Warnings:

  - You are about to drop the column `galleryId` on the `production` table. All the data in the column will be lost.
  - You are about to drop the column `other_gallery_id` on the `production` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "production" DROP CONSTRAINT "production_galleryId_fkey";

-- DropForeignKey
ALTER TABLE "production" DROP CONSTRAINT "production_other_gallery_id_fkey";

-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "thumbnail_index" INTEGER;

-- AlterTable
ALTER TABLE "production" DROP COLUMN "galleryId",
DROP COLUMN "other_gallery_id";
