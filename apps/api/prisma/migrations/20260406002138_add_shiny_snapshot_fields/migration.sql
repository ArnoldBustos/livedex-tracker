-- AlterTable
ALTER TABLE "SaveProfileDexEntry" ADD COLUMN     "shinyCaught" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shinyLiving" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shinyOwnedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shinySeen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalOwnedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SaveProfileDexOverride" ADD COLUMN     "shinyCaught" BOOLEAN,
ADD COLUMN     "shinyLiving" BOOLEAN,
ADD COLUMN     "shinySeen" BOOLEAN;
