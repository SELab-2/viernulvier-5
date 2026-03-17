/*
  Warnings:

  - A unique constraint covering the columns `[apiId]` on the table `crop` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `crosssells` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `event_price` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `gallery` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `genre` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `hall` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `mailinglist` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `optins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `orderticket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `organisations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `price` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `production` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `rank` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `space` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `status` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `subscriber` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `tag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `ticket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `uitdatabank_keywords` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `uitdatabank_themes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `uitdatabank_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `visitor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `visitor_tags` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "crop" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "crosssells" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "event_price" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "gallery" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "genre" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "hall" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "item" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "location" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "mailinglist" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "optins" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "orderticket" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "price" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "production" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "rank" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "space" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "status" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "subscriber" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "tag" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "uitdatabank_keywords" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "uitdatabank_themes" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "uitdatabank_types" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "visitor" ADD COLUMN     "apiId" VARCHAR;

-- AlterTable
ALTER TABLE "visitor_tags" ADD COLUMN     "apiId" VARCHAR;

-- CreateIndex
CREATE UNIQUE INDEX "crop_apiId_key" ON "crop"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "crosssells_apiId_key" ON "crosssells"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "event_apiId_key" ON "event"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "event_price_apiId_key" ON "event_price"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_apiId_key" ON "gallery"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "genre_apiId_key" ON "genre"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "hall_apiId_key" ON "hall"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "item_apiId_key" ON "item"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "location_apiId_key" ON "location"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "mailinglist_apiId_key" ON "mailinglist"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "optins_apiId_key" ON "optins"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "order_apiId_key" ON "order"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "orderticket_apiId_key" ON "orderticket"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_apiId_key" ON "organisations"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "price_apiId_key" ON "price"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "production_apiId_key" ON "production"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "rank_apiId_key" ON "rank"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "space_apiId_key" ON "space"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "status_apiId_key" ON "status"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_apiId_key" ON "subscriber"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "tag_apiId_key" ON "tag"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_apiId_key" ON "ticket"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "uitdatabank_keywords_apiId_key" ON "uitdatabank_keywords"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "uitdatabank_themes_apiId_key" ON "uitdatabank_themes"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "uitdatabank_types_apiId_key" ON "uitdatabank_types"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "user_apiId_key" ON "user"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_apiId_key" ON "visitor"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_tags_apiId_key" ON "visitor_tags"("apiId");
