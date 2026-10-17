-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('REUNION', 'VISITA_RECINTO', 'TAREA');

-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('PENDIENTE', 'COMPLETADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Actividad" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoActividad" NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "lugar" VARCHAR(200),
    "estado" "EstadoActividad" NOT NULL DEFAULT 'PENDIENTE',
    "eventoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActividadProductor" (
    "actividadId" INTEGER NOT NULL,
    "productorId" INTEGER NOT NULL,
    "esResponsable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActividadProductor_pkey" PRIMARY KEY ("actividadId","productorId")
);

-- CreateIndex
CREATE INDEX "Actividad_inicio_fin_idx" ON "Actividad"("inicio", "fin");

-- CreateIndex
CREATE INDEX "Actividad_eventoId_idx" ON "Actividad"("eventoId");

-- CreateIndex
CREATE INDEX "ActividadProductor_productorId_idx" ON "ActividadProductor"("productorId");

-- CreateIndex
CREATE INDEX "ActividadProductor_actividadId_esResponsable_idx" ON "ActividadProductor"("actividadId", "esResponsable");

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadProductor" ADD CONSTRAINT "ActividadProductor_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "Actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadProductor" ADD CONSTRAINT "ActividadProductor_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
