CREATE TYPE "TipoSeguimiento" AS ENUM ('NOVEDAD', 'INCIDENCIA', 'OBSERVACION', 'MODIFICACION', 'HITO');
CREATE TYPE "ImportanciaSeguimiento" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

CREATE TABLE "SeguimientoEvento" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoSeguimiento" NOT NULL,
    "importancia" "ImportanciaSeguimiento" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeguimientoEvento_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComentarioSeguimiento" (
    "id" SERIAL NOT NULL,
    "seguimientoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComentarioSeguimiento_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SeguimientoEvento_eventoId_createdAt_id_idx" ON "SeguimientoEvento"("eventoId", "createdAt", "id");
CREATE INDEX "SeguimientoEvento_usuarioId_idx" ON "SeguimientoEvento"("usuarioId");
CREATE INDEX "ComentarioSeguimiento_seguimientoId_createdAt_id_idx" ON "ComentarioSeguimiento"("seguimientoId", "createdAt", "id");
CREATE INDEX "ComentarioSeguimiento_usuarioId_idx" ON "ComentarioSeguimiento"("usuarioId");
ALTER TABLE "SeguimientoEvento" ADD CONSTRAINT "SeguimientoEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeguimientoEvento" ADD CONSTRAINT "SeguimientoEvento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComentarioSeguimiento" ADD CONSTRAINT "ComentarioSeguimiento_seguimientoId_fkey" FOREIGN KEY ("seguimientoId") REFERENCES "SeguimientoEvento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComentarioSeguimiento" ADD CONSTRAINT "ComentarioSeguimiento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
