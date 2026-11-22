CREATE TYPE "EstadoEncuestaPago" AS ENUM (
  'ENVIANDO',
  'ENVIADO',
  'SIMULADO',
  'NO_ENVIADO_CORREO',
  'FALLIDO'
);

ALTER TABLE "Pago"
  ADD COLUMN "confirmadoPorId" INTEGER,
  ADD COLUMN "confirmadoAt" TIMESTAMP(3);

CREATE INDEX "Pago_confirmadoPorId_idx" ON "Pago"("confirmadoPorId");

ALTER TABLE "Pago"
  ADD CONSTRAINT "Pago_confirmadoPorId_fkey"
  FOREIGN KEY ("confirmadoPorId") REFERENCES "Usuario"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "EncuestaPago" (
  "id" SERIAL NOT NULL,
  "pagoId" INTEGER NOT NULL,
  "estado" "EstadoEncuestaPago" NOT NULL DEFAULT 'NO_ENVIADO_CORREO',
  "encuestaUrl" TEXT,
  "motivo" VARCHAR(300),
  "intentos" INTEGER NOT NULL DEFAULT 0,
  "ultimoIntentoAt" TIMESTAMP(3),
  "enviadoAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EncuestaPago_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EncuestaPago_pagoId_key" ON "EncuestaPago"("pagoId");

ALTER TABLE "EncuestaPago"
  ADD CONSTRAINT "EncuestaPago_pagoId_fkey"
  FOREIGN KEY ("pagoId") REFERENCES "Pago"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
