ALTER TABLE "Evento" ADD COLUMN "espacioId" INTEGER;
ALTER TABLE "ReservaEspacio" ADD COLUMN "eventoId" INTEGER;
ALTER TABLE "ReservaRecurso" ADD COLUMN "eventoId" INTEGER;
ALTER TABLE "ReservaVehiculo" ADD COLUMN "eventoId" INTEGER;

CREATE INDEX "Evento_espacioId_idx" ON "Evento"("espacioId");
CREATE INDEX "ReservaEspacio_eventoId_idx" ON "ReservaEspacio"("eventoId");
CREATE INDEX "ReservaRecurso_eventoId_idx" ON "ReservaRecurso"("eventoId");
CREATE INDEX "ReservaVehiculo_eventoId_idx" ON "ReservaVehiculo"("eventoId");

ALTER TABLE "Evento" ADD CONSTRAINT "Evento_espacioId_fkey"
FOREIGN KEY ("espacioId") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReservaEspacio" ADD CONSTRAINT "ReservaEspacio_eventoId_fkey"
FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReservaRecurso" ADD CONSTRAINT "ReservaRecurso_eventoId_fkey"
FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReservaVehiculo" ADD CONSTRAINT "ReservaVehiculo_eventoId_fkey"
FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
