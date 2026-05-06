-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "credits" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isFreeElective" BOOLEAN NOT NULL DEFAULT false;
