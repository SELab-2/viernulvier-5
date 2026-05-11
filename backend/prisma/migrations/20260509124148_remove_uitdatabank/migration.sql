/*
  Warnings:

  - You are about to drop the column `uitdatabank_id` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `uitdatabank_id` on the `location` table. All the data in the column will be lost.
  - You are about to drop the column `uitdatabank_theme` on the `production` table. All the data in the column will be lost.
  - You are about to drop the column `uitdatabank_type` on the `production` table. All the data in the column will be lost.
  - You are about to drop the `uit_keywords_production` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uitdatabank_keyword` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uitdatabank_theme` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uitdatabank_type` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "production" DROP CONSTRAINT "production_uitdatabank_theme_fkey";

-- DropForeignKey
ALTER TABLE "production" DROP CONSTRAINT "production_uitdatabank_type_fkey";

-- DropForeignKey
ALTER TABLE "uit_keywords_production" DROP CONSTRAINT "uit_keywords_production_production_id_fkey";

-- DropForeignKey
ALTER TABLE "uit_keywords_production" DROP CONSTRAINT "uit_keywords_production_uitkeywords_id_fkey";

-- AlterTable
ALTER TABLE "event" DROP COLUMN "uitdatabank_id";

-- AlterTable
ALTER TABLE "location" DROP COLUMN "uitdatabank_id";

-- AlterTable
ALTER TABLE "production" DROP COLUMN "uitdatabank_theme",
DROP COLUMN "uitdatabank_type";

-- DropTable
DROP TABLE "uit_keywords_production";

-- DropTable
DROP TABLE "uitdatabank_keyword";

-- DropTable
DROP TABLE "uitdatabank_theme";

-- DropTable
DROP TABLE "uitdatabank_type";
