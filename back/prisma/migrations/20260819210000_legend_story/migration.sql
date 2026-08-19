CREATE TABLE "Legend" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Legend_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Legend" ("id", "title", "description", "updatedAt")
SELECT
    'default',
    'Seu nome é PRANKID',
    TRIM(BOTH E'\n' FROM CONCAT(
        COALESCE((SELECT "caption" FROM "LegendBeat" WHERE "sortOrder" = 1), ''),
        ' ',
        COALESCE((SELECT "caption" FROM "LegendBeat" WHERE "sortOrder" = 2), ''),
        E'\n\n',
        COALESCE((
            SELECT string_agg("caption", E'\n\n' ORDER BY "sortOrder")
            FROM "LegendBeat"
            WHERE "sortOrder" NOT IN (1, 2)
        ), '')
    )),
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "LegendBeat");

DROP TABLE "LegendBeat";
