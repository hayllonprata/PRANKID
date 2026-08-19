ALTER TABLE "Product" ADD COLUMN "personalized" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CustomBrief" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "likes" TEXT NOT NULL,
    "colors" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomBrief_pkey" PRIMARY KEY ("id")
);
