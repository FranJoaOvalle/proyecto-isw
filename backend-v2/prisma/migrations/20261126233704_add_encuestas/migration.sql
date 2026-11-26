-- CreateEnum
CREATE TYPE "TipoEncuesta" AS ENUM ('CLIENTE_EVENTO', 'ADMIN_PRODUCTOR');

-- CreateEnum
CREATE TYPE "TipoPreguntaEncuesta" AS ENUM ('ESCALA', 'TEXTO', 'SI_NO', 'SELECCION_UNICA', 'SELECCION_MULTIPLE');

-- CreateTable
CREATE TABLE "Encuesta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoEncuesta" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreguntaEncuesta" (
    "id" SERIAL NOT NULL,
    "encuestaId" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "tipo" "TipoPreguntaEncuesta" NOT NULL,
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL,
    "opciones" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "PreguntaEncuesta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Encuesta_tipo_activo_idx" ON "Encuesta"("tipo", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "PreguntaEncuesta_encuestaId_orden_key" ON "PreguntaEncuesta"("encuestaId", "orden");

-- AddForeignKey
ALTER TABLE "PreguntaEncuesta" ADD CONSTRAINT "PreguntaEncuesta_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
