-- CreateTable
CREATE TABLE "SiteAccess" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "city" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "countryCode" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "userAgent" TEXT NOT NULL DEFAULT '',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteAccess_ip_key" ON "SiteAccess"("ip");

-- CreateIndex
CREATE INDEX "SiteAccess_lastSeenAt_idx" ON "SiteAccess"("lastSeenAt");

-- CreateIndex
CREATE INDEX "SiteAccess_visitCount_idx" ON "SiteAccess"("visitCount");
