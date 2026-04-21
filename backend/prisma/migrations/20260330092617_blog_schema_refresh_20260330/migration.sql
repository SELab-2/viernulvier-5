-- CreateTable
CREATE TABLE "blog" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "title" TEXT,
    "content" JSONB,

    CONSTRAINT "blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_production" (
    "blog_id" UUID NOT NULL,
    "production_id" UUID NOT NULL,

    CONSTRAINT "blog_production_pkey" PRIMARY KEY ("blog_id","production_id")
);

-- AddForeignKey
ALTER TABLE "blog_production" ADD CONSTRAINT "blog_production_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blog_production" ADD CONSTRAINT "blog_production_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
