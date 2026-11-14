-- CreateEnum
CREATE TYPE "EstadoSolicitudEvento" AS ENUM ('PENDIENTE', 'EN_REVISION', 'CONTRATADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "Evento" ADD COLUMN     "solicitudId" INTEGER,
ALTER COLUMN "productorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Presupuesto" ADD COLUMN     "solicitudId" INTEGER;

-- CreateTable
CREATE TABLE "SolicitudEvento" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipoEventoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "asistentes" INTEGER NOT NULL,
    "lugar" VARCHAR(200),
    "observaciones" TEXT,
    "estado" "EstadoSolicitudEvento" NOT NULL DEFAULT 'PENDIENTE',
    "tipoCierre" TEXT,
    "motivoCierre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudEventoCambio" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "motivo" TEXT,
    "anterior" JSONB,
    "nuevo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudEventoCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitudEvento_clienteId_createdAt_idx" ON "SolicitudEvento"("clienteId", "createdAt");

-- CreateIndex
CREATE INDEX "SolicitudEvento_estado_createdAt_idx" ON "SolicitudEvento"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "SolicitudEvento_tipoEventoId_idx" ON "SolicitudEvento"("tipoEventoId");

-- CreateIndex
CREATE INDEX "SolicitudEventoCambio_solicitudId_createdAt_idx" ON "SolicitudEventoCambio"("solicitudId", "createdAt");

-- CreateIndex
CREATE INDEX "SolicitudEventoCambio_actorId_idx" ON "SolicitudEventoCambio"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "Evento_solicitudId_key" ON "Evento"("solicitudId");

-- CreateIndex
CREATE INDEX "Presupuesto_solicitudId_idx" ON "Presupuesto"("solicitudId");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudEvento" ADD CONSTRAINT "SolicitudEvento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudEvento" ADD CONSTRAINT "SolicitudEvento_tipoEventoId_fkey" FOREIGN KEY ("tipoEventoId") REFERENCES "TipoEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudEvento" ADD CONSTRAINT "SolicitudEvento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudEventoCambio" ADD CONSTRAINT "SolicitudEventoCambio_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudEventoCambio" ADD CONSTRAINT "SolicitudEventoCambio_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
