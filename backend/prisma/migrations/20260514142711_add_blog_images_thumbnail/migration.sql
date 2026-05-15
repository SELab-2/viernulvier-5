-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "thumbnail_index" INTEGER;
