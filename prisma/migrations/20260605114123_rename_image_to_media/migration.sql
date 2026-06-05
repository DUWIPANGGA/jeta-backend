-- AlterTable: rename image -> media and make nullable
ALTER TABLE "carousels" RENAME COLUMN "image" TO "media";
ALTER TABLE "carousels" ALTER COLUMN "media" DROP NOT NULL;
