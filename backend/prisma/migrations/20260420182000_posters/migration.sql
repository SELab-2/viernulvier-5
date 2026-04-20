-- CreateTable
CREATE TABLE "poster" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "title" VARCHAR NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR,
    "original_filename" VARCHAR,
    "file_size_bytes" INTEGER,
    "production_id" UUID NOT NULL,

    CONSTRAINT "poster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "poster_production_id_key" ON "poster"("production_id");

-- AddForeignKey
ALTER TABLE "poster" ADD CONSTRAINT "poster_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
