/*
  Warnings:

  - Added the required column `cantidadPersonasBase` to the `TipoEvento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TipoEvento" ADD COLUMN     "cantidadPersonasBase" INTEGER NOT NULL,
ADD COLUMN     "imagen_url" TEXT;
