/*
  Warnings:

  - You are about to drop the column `use_as` on the `genre` table. All the data in the column will be lost.
  - You are about to drop the column `automatically_assigned` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `enable` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `expires_after` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `external` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `gallery_id` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `short_description` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `sourcetype` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `url_title` on the `tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tag" DROP CONSTRAINT "tag_gallery_id_fkey";

-- AlterTable
ALTER TABLE "genre" DROP COLUMN "use_as";

-- AlterTable
ALTER TABLE "tag" DROP COLUMN "automatically_assigned",
DROP COLUMN "code",
DROP COLUMN "enable",
DROP COLUMN "expires_after",
DROP COLUMN "external",
DROP COLUMN "gallery_id",
DROP COLUMN "short_description",
DROP COLUMN "source",
DROP COLUMN "sourcetype",
DROP COLUMN "url",
DROP COLUMN "url_title",
ADD COLUMN     "description" JSONB,
ADD COLUMN     "slug" JSONB,
ADD COLUMN     "type" VARCHAR,
ADD COLUMN     "vendor_id" VARCHAR;

-- CreateTable
CREATE TABLE "tag_production" (
    "tag_id" UUID NOT NULL,
    "production_id" UUID NOT NULL,

    CONSTRAINT "tag_production_pkey" PRIMARY KEY ("tag_id","production_id")
);

-- AddForeignKey
ALTER TABLE "tag_production" ADD CONSTRAINT "tag_production_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tag_production" ADD CONSTRAINT "tag_production_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
