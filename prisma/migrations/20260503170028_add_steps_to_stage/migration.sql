/*
  Warnings:

  - Added the required column `steps` to the `stages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stages" ADD COLUMN     "steps" INTEGER NOT NULL;
