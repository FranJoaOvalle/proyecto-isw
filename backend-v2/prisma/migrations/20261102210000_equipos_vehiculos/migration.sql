-- CreateEnum
CREATE TYPE "EstadoDevolucionActivo" AS ENUM ('PENDIENTE', 'CONFORME', 'CON_OBSERVACIONES');

-- CreateEnum
CREATE TYPE "EstadoVehiculo" AS ENUM ('DISPONIBLE', 'EN_MANTENCION', 'RETIRADO');

-- AlterTable
ALTER TABLE "Recurso"
ADD COLUMN "cantidadEnMantencion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "cantidadPerdida" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "Recurso_stock_operativo_check"
CHECK (
    "cantidadEnMantencion" >= 0
    AND "cantidadPerdida" >= 0
    AND "cantidadEnMantencion" + "cantidadPerdida" <= "stockTotal"
);

-- CreateTable
CREATE TABLE "ReservaRecurso" (
    "id" SERIAL NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "referencia" VARCHAR(150) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fin" TIMESTAMPTZ(3) NOT NULL,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "estadoDevolucion" "EstadoDevolucionActivo" NOT NULL DEFAULT 'PENDIENTE',
    "cantidadDanada" INTEGER NOT NULL DEFAULT 0,
    "cantidadPerdida" INTEGER NOT NULL DEFAULT 0,
    "observacionesDevolucion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservaRecurso_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReservaRecurso_cantidad_check" CHECK ("cantidad" > 0),
    CONSTRAINT "ReservaRecurso_intervalo_check" CHECK ("fin" > "inicio"),
    CONSTRAINT "ReservaRecurso_devolucion_check" CHECK (
        "cantidadDanada" >= 0
        AND "cantidadPerdida" >= 0
        AND "cantidadDanada" + "cantidadPerdida" <= "cantidad"
    ),
    CONSTRAINT "ReservaRecurso_recursoId_fkey" FOREIGN KEY ("recursoId")
        REFERENCES "Recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" SERIAL NOT NULL,
    "patente" VARCHAR(15) NOT NULL,
    "tipo" VARCHAR(60) NOT NULL,
    "marca" VARCHAR(60) NOT NULL,
    "modelo" VARCHAR(80) NOT NULL,
    "anio" INTEGER,
    "capacidadPasajeros" INTEGER,
    "estado" "EstadoVehiculo" NOT NULL DEFAULT 'DISPONIBLE',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Vehiculo_anio_check" CHECK ("anio" IS NULL OR "anio" BETWEEN 1900 AND 2200),
    CONSTRAINT "Vehiculo_capacidad_check" CHECK ("capacidadPasajeros" IS NULL OR "capacidadPasajeros" > 0)
);

-- CreateTable
CREATE TABLE "ReservaVehiculo" (
    "id" SERIAL NOT NULL,
    "vehiculoId" INTEGER NOT NULL,
    "referencia" VARCHAR(150) NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fin" TIMESTAMPTZ(3) NOT NULL,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "estadoDevolucion" "EstadoDevolucionActivo" NOT NULL DEFAULT 'PENDIENTE',
    "observacionesDevolucion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservaVehiculo_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReservaVehiculo_intervalo_check" CHECK ("fin" > "inicio"),
    CONSTRAINT "ReservaVehiculo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId")
        REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReservaRecurso_recursoId_inicio_fin_idx" ON "ReservaRecurso"("recursoId", "inicio", "fin");
CREATE INDEX "Vehiculo_estado_tipo_idx" ON "Vehiculo"("estado", "tipo");
CREATE INDEX "ReservaVehiculo_vehiculoId_inicio_fin_idx" ON "ReservaVehiculo"("vehiculoId", "inicio", "fin");
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "Vehiculo"("patente");
