/*
  Warnings:

  - The `rooms` column on the `Detail` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bedromms` column on the `Detail` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bathrooms` column on the `Detail` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Detail" DROP COLUMN "rooms",
ADD COLUMN     "rooms" INTEGER,
DROP COLUMN "bedromms",
ADD COLUMN     "bedromms" INTEGER,
DROP COLUMN "bathrooms",
ADD COLUMN     "bathrooms" INTEGER;
