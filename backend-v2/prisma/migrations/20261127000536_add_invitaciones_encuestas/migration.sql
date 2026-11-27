-- CreateEnum
CREATE TYPE "EstadoInvitacionEncuesta" AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA');

-- CreateTable
CREATE TABLE "EncuestaPredeterminada" (
    "tipo" "TipoEncuesta" NOT NULL,
    "encuestaId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EncuestaPredeterminada_pkey" PRIMARY KEY ("tipo")
);

-- CreateTable
CREATE TABLE "InvitacionEncuesta" (
    "id" SERIAL NOT NULL,
    "encuestaId" INTEGER NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "destinatario" TEXT NOT NULL,
    "tokenHash" TEXT,
    "expiraAt" TIMESTAMP(3),
    "formulario" JSONB NOT NULL,
    "respuestas" JSONB,
    "estado" "EstadoInvitacionEncuesta" NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimoError" TEXT,
    "enviadoAt" TIMESTAMP(3),
    "respondidoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitacionEncuesta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitacionEncuesta_eventoId_key" ON "InvitacionEncuesta"("eventoId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitacionEncuesta_tokenHash_key" ON "InvitacionEncuesta"("tokenHash");

-- CreateIndex
CREATE INDEX "InvitacionEncuesta_estado_idx" ON "InvitacionEncuesta"("estado");

-- CreateIndex
CREATE INDEX "InvitacionEncuesta_encuestaId_idx" ON "InvitacionEncuesta"("encuestaId");

-- AddForeignKey
ALTER TABLE "EncuestaPredeterminada" ADD CONSTRAINT "EncuestaPredeterminada_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitacionEncuesta" ADD CONSTRAINT "InvitacionEncuesta_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitacionEncuesta" ADD CONSTRAINT "InvitacionEncuesta_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
