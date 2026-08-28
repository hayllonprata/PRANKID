ALTER TABLE "Product" ADD COLUMN "hasSizes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CustomBrief" ADD COLUMN "size" TEXT NOT NULL DEFAULT '';

CREATE TABLE "SizeOrder" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SizeOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SizeOrder_createdAt_idx" ON "SizeOrder"("createdAt");
