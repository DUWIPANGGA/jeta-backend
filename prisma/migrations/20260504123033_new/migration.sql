/*
  Warnings:

  - Added the required column `create` to the `accesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `delete` to the `accesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `read` to the `accesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `update` to the `accesses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accesses" ADD COLUMN     "create" BOOLEAN NOT NULL,
ADD COLUMN     "delete" BOOLEAN NOT NULL,
ADD COLUMN     "read" BOOLEAN NOT NULL,
ADD COLUMN     "update" BOOLEAN NOT NULL;
