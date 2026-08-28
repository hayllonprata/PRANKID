ALTER TABLE "Product" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;
UPDATE "Product" SET "stock" = 1 WHERE "stock" = 0;
