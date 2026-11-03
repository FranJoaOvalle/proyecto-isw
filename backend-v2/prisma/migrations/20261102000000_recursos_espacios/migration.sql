-- CreateEnum
CREATE TYPE "UnidadArriendo" AS ENUM ('HORA', 'DIA', 'EVENTO');

-- CreateTable
CREATE TABLE "Espacio" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(250) NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "costoArriendo" DECIMAL(12,2),
    "unidadArriendo" "UnidadArriendo",
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Espacio_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Espacio_capacidad_check" CHECK ("capacidad" > 0)
);

-- CreateTable
CREATE TABLE "ReservaEspacio" (
    "id" SERIAL NOT NULL,
    "espacioId" INTEGER NOT NULL,
    "referencia" VARCHAR(150) NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fin" TIMESTAMPTZ(3) NOT NULL,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservaEspacio_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReservaEspacio_espacioId_fkey" FOREIGN KEY ("espacioId") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReservaEspacio_intervalo_check" CHECK ("fin" > "inicio")
);

-- CreateIndex
CREATE INDEX "Espacio_nombre_idx" ON "Espacio"("nombre");

-- CreateIndex
CREATE INDEX "ReservaEspacio_espacioId_inicio_fin_idx" ON "ReservaEspacio"("espacioId", "inicio", "fin");
