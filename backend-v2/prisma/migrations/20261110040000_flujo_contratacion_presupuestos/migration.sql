ALTER TYPE "EstadoPresupuesto" ADD VALUE 'ENVIADO';

ALTER TABLE "Presupuesto"
    ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "enviadoAt" TIMESTAMP(3),
    ADD COLUMN "enviadoPorId" INTEGER,
    ADD COLUMN "aceptadoAt" TIMESTAMP(3),
    ADD COLUMN "aceptadoPorId" INTEGER,
    ADD COLUMN "versionAceptada" INTEGER,
    ADD COLUMN "espacioId" INTEGER,
    ADD COLUMN "direccion" VARCHAR(250),
    ADD COLUMN "comuna" VARCHAR(100),
    ADD COLUMN "referenciaDireccion" VARCHAR(500);

CREATE INDEX "Presupuesto_espacioId_idx" ON "Presupuesto"("espacioId");

ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_enviadoPorId_fkey"
    FOREIGN KEY ("enviadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_aceptadoPorId_fkey"
    FOREIGN KEY ("aceptadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_espacioId_fkey"
    FOREIGN KEY ("espacioId") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
