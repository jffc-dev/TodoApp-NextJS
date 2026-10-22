-- Grupos de regalos. Los regalos existentes pasan a un grupo "General" por votación.

-- CreateTable
CREATE TABLE "GiftGroup" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GiftGroup_pollId_position_idx" ON "GiftGroup"("pollId", "position");

-- AddForeignKey
ALTER TABLE "GiftGroup" ADD CONSTRAINT "GiftGroup_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grupo por defecto para cada votación existente
INSERT INTO "GiftGroup" ("id", "pollId", "name", "position", "updatedAt")
SELECT 'default_' || "id", "id", 'General', 0, CURRENT_TIMESTAMP FROM "Poll";

-- Nueva columna: primero opcional, se completa y luego se vuelve obligatoria
ALTER TABLE "Gift" ADD COLUMN "groupId" TEXT;
UPDATE "Gift" SET "groupId" = 'default_' || "pollId";
ALTER TABLE "Gift" ALTER COLUMN "groupId" SET NOT NULL;

-- DropIndex
DROP INDEX "Gift_pollId_position_idx";

-- CreateIndex
CREATE INDEX "Gift_groupId_position_idx" ON "Gift"("groupId", "position");

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GiftGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
