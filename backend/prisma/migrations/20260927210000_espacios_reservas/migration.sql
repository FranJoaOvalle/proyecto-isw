CREATE TABLE "Espacio" (
 "id" SERIAL PRIMARY KEY,
 "nombre" VARCHAR(100) NOT NULL,
 "direccion" VARCHAR(250) NOT NULL,
 "capacidad" INTEGER NOT NULL CHECK ("capacidad" > 0),
 "habilitado" BOOLEAN NOT NULL DEFAULT true,
 "observaciones" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "ReservaEspacio" (
 "id" SERIAL PRIMARY KEY,
 "espacioId" INTEGER NOT NULL REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "referencia" VARCHAR(150) NOT NULL,
 "inicio" TIMESTAMPTZ(3) NOT NULL,
 "fin" TIMESTAMPTZ(3) NOT NULL,
 "cancelada" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "reserva_intervalo_valido" CHECK ("fin" > "inicio")
);
CREATE INDEX "ReservaEspacio_espacioId_inicio_fin_idx" ON "ReservaEspacio"("espacioId", "inicio", "fin");
