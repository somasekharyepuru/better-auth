-- CreateTable
CREATE TABLE "time_block_type" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366F1',
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_block_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_block_type_userId_idx" ON "time_block_type"("userId");

-- CreateIndex
CREATE INDEX "time_block_type_isDefault_idx" ON "time_block_type"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "time_block_type_userId_name_key" ON "time_block_type"("userId", "name");
