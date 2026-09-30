/*
  Warnings:

  - You are about to drop the column `email` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Personal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuarioId]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[usuarioId]` on the table `Personal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('CLIENTE', 'PRODUCCION', 'COMERCIAL', 'ADMIN');

-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "email",
ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "Personal" DROP COLUMN "email",
ADD COLUMN     "usuarioId" INTEGER;

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_usuarioId_key" ON "Cliente"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Personal_usuarioId_key" ON "Personal"("usuarioId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personal" ADD CONSTRAINT "Personal_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
