/*
  Warnings:

  - You are about to drop the column `statAgi` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `statFoc` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `xpToNextLevel` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "statAgi",
DROP COLUMN "statFoc",
DROP COLUMN "xpToNextLevel",
ALTER COLUMN "statStr" SET DEFAULT 1,
ALTER COLUMN "statEnd" SET DEFAULT 1,
ALTER COLUMN "statInt" SET DEFAULT 1,
ALTER COLUMN "statWis" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approachesCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "muscleTension" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "quizzesPassed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalBodyEffort" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalMindEffort" DOUBLE PRECISION NOT NULL DEFAULT 0;
