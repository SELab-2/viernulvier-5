/*
  Warnings:

  - You are about to drop the `poster` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "poster" DROP CONSTRAINT "poster_production_id_fkey";

-- DropTable
DROP TABLE "poster";
