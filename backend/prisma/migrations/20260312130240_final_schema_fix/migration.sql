/*
  Warnings:

  - You are about to drop the `organisations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "organisations";

-- CreateTable
CREATE TABLE "last_scraped" (
    "time" TIMESTAMP(3) NOT NULL,
    "id" UUID NOT NULL,

    CONSTRAINT "last_scraped_pkey" PRIMARY KEY ("id")
);
