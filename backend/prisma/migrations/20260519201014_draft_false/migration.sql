/*
  Warnings:

  - You are about to drop the column `galleryId` on the `production` table. All the data in the column will be lost.
  - You are about to drop the column `other_gallery_id` on the `production` table. All the data in the column will be lost.

*/

-- AlterTable
ALTER TABLE "production"
ALTER COLUMN "draft" SET DEFAULT false;
