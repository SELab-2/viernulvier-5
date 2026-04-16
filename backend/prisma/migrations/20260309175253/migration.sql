/*
  Warnings:

  - You are about to drop the column `price_id` on the `event_price` table. All the data in the column will be lost.
  - You are about to drop the column `rank_id` on the `event_price` table. All the data in the column will be lost.
  - You are about to drop the column `crops` on the `item` table. All the data in the column will be lost.
  - You are about to drop the `crosssells` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gallery_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mailinglist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `optins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orderticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `price` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriber` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriber_mailinglist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriber_optins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uit_keywords_productions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uitdatabank_keywords` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uitdatabank_themes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uitdatabank_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visitor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visitor_tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "crosssells" DROP CONSTRAINT "crosssells_order_id_fkey";

-- DropForeignKey
ALTER TABLE "crosssells" DROP CONSTRAINT "crosssells_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_status_id_fkey";

-- DropForeignKey
ALTER TABLE "event_price" DROP CONSTRAINT "event_price_price_id_fkey";

-- DropForeignKey
ALTER TABLE "event_price" DROP CONSTRAINT "event_price_rank_id_fkey";

-- DropForeignKey
ALTER TABLE "gallery_item" DROP CONSTRAINT "gallery_item_gallery_id_fkey";

-- DropForeignKey
ALTER TABLE "gallery_item" DROP CONSTRAINT "gallery_item_item_id_fkey";

-- DropForeignKey
ALTER TABLE "item" DROP CONSTRAINT "item_crops_fkey";

-- DropForeignKey
ALTER TABLE "item" DROP CONSTRAINT "item_gallery_id_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_visitor_id_fkey";

-- DropForeignKey
ALTER TABLE "orderticket" DROP CONSTRAINT "orderticket_order_id_fkey";

-- DropForeignKey
ALTER TABLE "orderticket" DROP CONSTRAINT "orderticket_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "production" DROP CONSTRAINT "production_uitdatabank_theme_fkey";

-- DropForeignKey
ALTER TABLE "production" DROP CONSTRAINT "production_uitdatabank_type_fkey";

-- DropForeignKey
ALTER TABLE "subscriber" DROP CONSTRAINT "subscriber_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriber_mailinglist" DROP CONSTRAINT "subscriber_mailinglist_mailinglist_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriber_mailinglist" DROP CONSTRAINT "subscriber_mailinglist_subscriber_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriber_optins" DROP CONSTRAINT "subscriber_optins_optins_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriber_optins" DROP CONSTRAINT "subscriber_optins_subscriber_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_event_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_order_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_price_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_rank_id_fkey";

-- DropForeignKey
ALTER TABLE "uit_keywords_productions" DROP CONSTRAINT "uit_keywords_productions_production_id_fkey";

-- DropForeignKey
ALTER TABLE "uit_keywords_productions" DROP CONSTRAINT "uit_keywords_productions_uitkeywords_id_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_visitor_id_fkey";

-- DropForeignKey
ALTER TABLE "visitor_tags" DROP CONSTRAINT "visitor_tags_tags_fkey";

-- DropForeignKey
ALTER TABLE "visitor_tags" DROP CONSTRAINT "visitor_tags_visitor_id_fkey";

-- AlterTable
ALTER TABLE "crop" ADD COLUMN     "item_id" UUID;

-- AlterTable
ALTER TABLE "event_price" DROP COLUMN "price_id",
DROP COLUMN "rank_id";

-- AlterTable
ALTER TABLE "item" DROP COLUMN "crops";

-- DropTable
DROP TABLE "crosssells";

-- DropTable
DROP TABLE "gallery_item";

-- DropTable
DROP TABLE "mailinglist";

-- DropTable
DROP TABLE "optins";

-- DropTable
DROP TABLE "order";

-- DropTable
DROP TABLE "orderticket";

-- DropTable
DROP TABLE "price";

-- DropTable
DROP TABLE "rank";

-- DropTable
DROP TABLE "status";

-- DropTable
DROP TABLE "subscriber";

-- DropTable
DROP TABLE "subscriber_mailinglist";

-- DropTable
DROP TABLE "subscriber_optins";

-- DropTable
DROP TABLE "ticket";

-- DropTable
DROP TABLE "uit_keywords_productions";

-- DropTable
DROP TABLE "uitdatabank_keywords";

-- DropTable
DROP TABLE "uitdatabank_themes";

-- DropTable
DROP TABLE "uitdatabank_types";

-- DropTable
DROP TABLE "user";

-- DropTable
DROP TABLE "visitor";

-- DropTable
DROP TABLE "visitor_tags";

-- CreateTable
CREATE TABLE "uit_keywords_production" (
    "production_id" UUID NOT NULL,
    "uitkeywords_id" UUID NOT NULL,

    CONSTRAINT "uit_keywords_production_pkey" PRIMARY KEY ("production_id","uitkeywords_id")
);

-- CreateTable
CREATE TABLE "uitdatabank_keyword" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "apiId" VARCHAR,
    "name" VARCHAR,

    CONSTRAINT "uitdatabank_keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uitdatabank_theme" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "apiId" VARCHAR,
    "name" VARCHAR,
    "cdb_cat_id" VARCHAR,

    CONSTRAINT "uitdatabank_theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uitdatabank_type" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "apiId" VARCHAR,
    "name" VARCHAR,
    "cdb_cat_id" VARCHAR,

    CONSTRAINT "uitdatabank_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uitdatabank_keyword_apiId_key" ON "uitdatabank_keyword"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "uitdatabank_theme_apiId_key" ON "uitdatabank_theme"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "uitdatabank_type_apiId_key" ON "uitdatabank_type"("apiId");

-- AddForeignKey
ALTER TABLE "crop" ADD CONSTRAINT "crop_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_uitdatabank_theme_fkey" FOREIGN KEY ("uitdatabank_theme") REFERENCES "uitdatabank_theme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_uitdatabank_type_fkey" FOREIGN KEY ("uitdatabank_type") REFERENCES "uitdatabank_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uit_keywords_production" ADD CONSTRAINT "uit_keywords_production_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uit_keywords_production" ADD CONSTRAINT "uit_keywords_production_uitkeywords_id_fkey" FOREIGN KEY ("uitkeywords_id") REFERENCES "uitdatabank_keyword"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
