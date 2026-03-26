/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'ADMIN';

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "crop" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR,
    "url" VARCHAR,

    CONSTRAINT "crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crosssells" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "ticket_id" UUID,
    "ticket_type" VARCHAR,
    "booking_id" VARCHAR,
    "price" VARCHAR,
    "hall_section_code" VARCHAR,
    "order_id" UUID,

    CONSTRAINT "crosssells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "starts_at" TIMESTAMP(6),
    "ends_at" TIMESTAMP(6),
    "intermission_at" TIMESTAMP(6),
    "doors_at" TIMESTAMP(6),
    "box_office_id" VARCHAR,
    "vendor_id" VARCHAR,
    "max_tickets_per_order" INTEGER,
    "uitdatabank_id" VARCHAR,
    "secure" BOOLEAN,
    "sms_verification" BOOLEAN,
    "info" JSONB,
    "eticket_info" JSONB,
    "external_order_url" JSONB,
    "order_url" VARCHAR,
    "production_id" UUID,
    "status_id" UUID,
    "hall_id" UUID,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_price" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "event_id" UUID,
    "available" INTEGER,
    "amount" VARCHAR,
    "box_office_id" VARCHAR,
    "contigent_id" INTEGER,
    "expires_at" TIMESTAMP(6),
    "price_id" UUID,
    "rank_id" UUID,

    CONSTRAINT "event_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR,

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_item" (
    "gallery_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,

    CONSTRAINT "gallery_item_pkey" PRIMARY KEY ("gallery_id","item_id")
);

-- CreateTable
CREATE TABLE "genre" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "type" VARCHAR,
    "use_as" VARCHAR,
    "vendor_id" VARCHAR,
    "name" JSONB,
    "slug" JSONB,
    "description" JSONB,

    CONSTRAINT "genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre_production" (
    "genre_id" UUID NOT NULL,
    "production_id" UUID NOT NULL,

    CONSTRAINT "genre_production_pkey" PRIMARY KEY ("genre_id","production_id")
);

-- CreateTable
CREATE TABLE "hall" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "vendor_id" VARCHAR,
    "box_office_id" VARCHAR,
    "seat_selection" VARCHAR,
    "open_seating" VARCHAR,
    "name" JSONB,
    "remark" JSONB,
    "space_id" UUID,

    CONSTRAINT "hall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "type" VARCHAR,
    "original_filename" VARCHAR,
    "position" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "format" VARCHAR,
    "gallery_id" UUID,
    "title" JSONB,
    "description" JSONB,
    "credits" JSONB,
    "link" JSONB,
    "crops" UUID,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" JSONB,
    "code" VARCHAR,
    "street" VARCHAR,
    "number" VARCHAR,
    "postal_code" VARCHAR,
    "city" VARCHAR,
    "phone_1" VARCHAR,
    "phone_2" VARCHAR,
    "own_location" VARCHAR,
    "country" VARCHAR,
    "uitdatabank_id" VARCHAR,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mailinglist" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR,
    "type" VARCHAR,
    "public" VARCHAR,
    "one_time" VARCHAR,

    CONSTRAINT "mailinglist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optins" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "key_name" VARCHAR,
    "name" VARCHAR,
    "title" JSONB,
    "description" JSONB,
    "provider" VARCHAR,
    "code" VARCHAR,
    "type" VARCHAR,

    CONSTRAINT "optins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "ordered_at" TIMESTAMP(6),
    "total_amount" VARCHAR,
    "box_office_id" VARCHAR,
    "visitor_id" UUID,
    "publiq_statistical_sector_id" VARCHAR,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderticket" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "ticket_type" VARCHAR,
    "booking_id" VARCHAR,
    "price" VARCHAR,
    "hall_section_code" VARCHAR,
    "order_id" UUID,
    "ticket_id" UUID,

    CONSTRAINT "orderticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "type" VARCHAR,
    "visibility" VARCHAR,
    "code" VARCHAR,
    "description" JSONB,
    "minimum" INTEGER,
    "maximum" INTEGER,
    "step" INTEGER,
    "order" INTEGER,
    "auto_select_combo" BOOLEAN,
    "include_in_price_range" BOOLEAN,
    "cineville_box" BOOLEAN,
    "membership" VARCHAR,

    CONSTRAINT "price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "vendor_id" VARCHAR,
    "box_office_id" INTEGER,
    "performer_field" VARCHAR,
    "performer_type" VARCHAR,
    "attendance_mode" VARCHAR,
    "super_title" JSONB,
    "title" JSONB,
    "artist" JSONB,
    "meta_title" JSONB,
    "meta_description" JSONB,
    "tagline" JSONB,
    "teaser" JSONB,
    "description" JSONB,
    "description_extra" JSONB,
    "description_2" JSONB,
    "video_1" JSONB,
    "video_2" JSONB,
    "quote" JSONB,
    "quote_source" JSONB,
    "programme" JSONB,
    "info" JSONB,
    "description_short" JSONB,
    "eticket_info" JSONB,
    "custom_data" JSONB,
    "media_gallery_id" UUID,
    "review_gallery_id" UUID,
    "poster_gallery_id" UUID,
    "uitdatabank_theme" UUID,
    "uitdatabank_type" UUID,

    CONSTRAINT "production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "description" JSONB,
    "code" VARCHAR,
    "position" INTEGER,
    "sold_out_buffer" INTEGER,

    CONSTRAINT "rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "vendor_id" VARCHAR,
    "name" JSONB,
    "location_id" UUID,

    CONSTRAINT "space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" JSONB,
    "short_name" VARCHAR,
    "fixed" BOOLEAN,
    "visible" BOOLEAN,
    "bookable" BOOLEAN,

    CONSTRAINT "status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "confirmed" BOOLEAN,
    "bounces" INTEGER,
    "user_id" UUID,

    CONSTRAINT "subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber_mailinglist" (
    "subscriber_id" UUID NOT NULL,
    "mailinglist_id" UUID NOT NULL,

    CONSTRAINT "subscriber_mailinglist_pkey" PRIMARY KEY ("subscriber_id","mailinglist_id")
);

-- CreateTable
CREATE TABLE "subscriber_optins" (
    "subscriber_id" UUID NOT NULL,
    "optins_id" UUID NOT NULL,

    CONSTRAINT "subscriber_optins_pkey" PRIMARY KEY ("subscriber_id","optins_id")
);

-- CreateTable
CREATE TABLE "tag" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "source" VARCHAR,
    "sourcetype" VARCHAR,
    "enable" VARCHAR,
    "code" VARCHAR,
    "name" JSONB,
    "short_description" JSONB,
    "url" VARCHAR,
    "url_title" JSONB,
    "expires_after" INTEGER,
    "automatically_assigned" BOOLEAN,
    "external" BOOLEAN,
    "gallery_id" UUID,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "available_from" TIMESTAMP(6),
    "seat_id" VARCHAR,
    "seat_row" VARCHAR,
    "seat_description" VARCHAR,
    "external_data" TEXT,
    "order_id" UUID,
    "event_id" UUID,
    "price_id" UUID,
    "rank_id" UUID,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uit_keywords_productions" (
    "production_id" UUID NOT NULL,
    "uitkeywords_id" UUID NOT NULL,

    CONSTRAINT "uit_keywords_productions_pkey" PRIMARY KEY ("production_id","uitkeywords_id")
);

-- CreateTable
CREATE TABLE "uitdatabank_keywords" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR,

    CONSTRAINT "uitdatabank_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uitdatabank_themes" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR,
    "cdb_cat_id" VARCHAR,

    CONSTRAINT "uitdatabank_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uitdatabank_types" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR,
    "cdb_cat_id" VARCHAR,

    CONSTRAINT "uitdatabank_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "last_active_at" TIMESTAMP(6),
    "gender" VARCHAR,
    "initials" VARCHAR,
    "postcode" VARCHAR,
    "city" VARCHAR,
    "country" VARCHAR,
    "date_of_birth" TIMESTAMP(6),
    "visitor_id" UUID,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "box_office_id" VARCHAR,
    "optins_chosen" BOOLEAN,
    "optins_skipped_at" TIMESTAMP(6),

    CONSTRAINT "visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_tags" (
    "id" UUID NOT NULL,
    "external_data" TEXT,
    "expires_at" TIMESTAMP(6),
    "visitor_id" UUID,
    "tags" UUID,

    CONSTRAINT "visitor_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_visitor_id_key" ON "user"("visitor_id");

-- AddForeignKey
ALTER TABLE "crosssells" ADD CONSTRAINT "crosssells_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "crosssells" ADD CONSTRAINT "crosssells_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_hall_id_fkey" FOREIGN KEY ("hall_id") REFERENCES "hall"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_price" ADD CONSTRAINT "event_price_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_price" ADD CONSTRAINT "event_price_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "price"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_price" ADD CONSTRAINT "event_price_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "rank"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gallery_item" ADD CONSTRAINT "gallery_item_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gallery_item" ADD CONSTRAINT "gallery_item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "genre_production" ADD CONSTRAINT "genre_production_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genre"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "genre_production" ADD CONSTRAINT "genre_production_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hall" ADD CONSTRAINT "hall_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "space"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_crops_fkey" FOREIGN KEY ("crops") REFERENCES "crop"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orderticket" ADD CONSTRAINT "orderticket_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orderticket" ADD CONSTRAINT "orderticket_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_media_gallery_id_fkey" FOREIGN KEY ("media_gallery_id") REFERENCES "gallery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_poster_gallery_id_fkey" FOREIGN KEY ("poster_gallery_id") REFERENCES "gallery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_review_gallery_id_fkey" FOREIGN KEY ("review_gallery_id") REFERENCES "gallery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_uitdatabank_theme_fkey" FOREIGN KEY ("uitdatabank_theme") REFERENCES "uitdatabank_themes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_uitdatabank_type_fkey" FOREIGN KEY ("uitdatabank_type") REFERENCES "uitdatabank_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "space" ADD CONSTRAINT "space_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriber" ADD CONSTRAINT "subscriber_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriber_mailinglist" ADD CONSTRAINT "subscriber_mailinglist_mailinglist_id_fkey" FOREIGN KEY ("mailinglist_id") REFERENCES "mailinglist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriber_mailinglist" ADD CONSTRAINT "subscriber_mailinglist_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriber_optins" ADD CONSTRAINT "subscriber_optins_optins_id_fkey" FOREIGN KEY ("optins_id") REFERENCES "optins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriber_optins" ADD CONSTRAINT "subscriber_optins_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "price"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "rank"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uit_keywords_productions" ADD CONSTRAINT "uit_keywords_productions_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uit_keywords_productions" ADD CONSTRAINT "uit_keywords_productions_uitkeywords_id_fkey" FOREIGN KEY ("uitkeywords_id") REFERENCES "uitdatabank_keywords"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visitor_tags" ADD CONSTRAINT "visitor_tags_tags_fkey" FOREIGN KEY ("tags") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visitor_tags" ADD CONSTRAINT "visitor_tags_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
