-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "draft" BOOLEAN;

-- AlterTable
ALTER TABLE "production" ADD COLUMN     "draft" BOOLEAN;

-- CreateTable
CREATE TABLE "editor_blog" (
    "editor_id" UUID NOT NULL,
    "blog_id" UUID NOT NULL,

    CONSTRAINT "editor_blog_pkey" PRIMARY KEY ("editor_id","blog_id")
);

-- CreateTable
CREATE TABLE "editor_production" (
    "editor_id" UUID NOT NULL,
    "production_id" UUID NOT NULL,

    CONSTRAINT "editor_production_pkey" PRIMARY KEY ("editor_id","production_id")
);

-- AddForeignKey
ALTER TABLE "editor_blog" ADD CONSTRAINT "editor_blog_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "editor_blog" ADD CONSTRAINT "editor_blog_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "editor_production" ADD CONSTRAINT "editor_production_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "editor_production" ADD CONSTRAINT "editor_production_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
