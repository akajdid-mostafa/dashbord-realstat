-- CreateEnum
CREATE TYPE "Status" AS ENUM ('available', 'unavailable', 'taken');

-- CreateEnum
CREATE TYPE "CategoryName" AS ENUM ('Location', 'Vente');

-- CreateEnum
CREATE TYPE "TypeName" AS ENUM ('Bureau', 'Land', 'Home', 'Park');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "img" JSONB[],
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "prix" TEXT NOT NULL,
    "adress" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT,
    "youtub" TEXT,
    "categoryId" INTEGER,
    "typeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partennaire" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,

    CONSTRAINT "Partennaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" "CategoryName" NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Type" (
    "id" SERIAL NOT NULL,
    "type" "TypeName" NOT NULL,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Detail" (
    "id" SERIAL NOT NULL,
    "constructionyear" TEXT,
    "surface" TEXT,
    "rooms" TEXT,
    "bedromms" TEXT,
    "livingrooms" TEXT,
    "kitchen" TEXT,
    "bathrooms" TEXT,
    "furnished" TEXT,
    "floor" TEXT,
    "elevator" TEXT,
    "parking" TEXT,
    "balcony" TEXT,
    "pool" TEXT,
    "facade" TEXT,
    "documents" TEXT,
    "postId" INTEGER NOT NULL,
    "Guard" TEXT,
    "Proprietary" TEXT,

    CONSTRAINT "Detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateReserve" (
    "id" SERIAL NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFine" TIMESTAMP(3),
    "fullName" TEXT NOT NULL,
    "CIN" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "postId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DateReserve_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Detail_postId_key" ON "Detail"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "DateReserve_postId_key" ON "DateReserve"("postId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detail" ADD CONSTRAINT "Detail_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateReserve" ADD CONSTRAINT "DateReserve_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
