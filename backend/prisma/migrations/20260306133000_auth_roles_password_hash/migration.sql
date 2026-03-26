ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'EDITOR';

ALTER TABLE "users"
RENAME COLUMN "password" TO "password_hash";
