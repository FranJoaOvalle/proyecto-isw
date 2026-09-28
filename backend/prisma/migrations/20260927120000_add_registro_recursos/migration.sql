ALTER TYPE "RolUsuario" ADD VALUE 'OPERACIONES_LOGISTICA';
ALTER TYPE "RolUsuario" ADD VALUE 'BODEGA';

CREATE TYPE "EstadoRecurso" AS ENUM ('DISPONIBLE', 'EN_REPARACION', 'RETIRADO');

CREATE TABLE "recurso" (
    "id_recurso" SERIAL NOT NULL,
    "tipo" VARCHAR(80) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" "EstadoRecurso" NOT NULL DEFAULT 'DISPONIBLE',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurso_pkey" PRIMARY KEY ("id_recurso"),
    CONSTRAINT "recurso_cantidad_no_negativa" CHECK ("cantidad" >= 0)
);
