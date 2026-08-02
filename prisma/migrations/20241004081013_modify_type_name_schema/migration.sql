-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeName" ADD VALUE 'Appartement';
ALTER TYPE "TypeName" ADD VALUE 'Maisons';
ALTER TYPE "TypeName" ADD VALUE 'villasRiad';
ALTER TYPE "TypeName" ADD VALUE 'Bureaux';
ALTER TYPE "TypeName" ADD VALUE 'Local';
ALTER TYPE "TypeName" ADD VALUE 'Terrains';
