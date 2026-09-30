ALTER TABLE "recurso" ADD COLUMN "origen" VARCHAR(15) NOT NULL DEFAULT 'SIN_DEFINIR', ADD COLUMN "costoArriendo" DECIMAL(12,0), ADD COLUMN "unidadArriendo" VARCHAR(10);
ALTER TABLE "Espacio" ADD COLUMN "costoArriendo" DECIMAL(12,0), ADD COLUMN "unidadArriendo" VARCHAR(10);
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_tarifa_valida" CHECK (
 "origen" IN ('PROPIO','ARRENDADO','SIN_DEFINIR') AND
 (("costoArriendo" IS NULL AND "unidadArriendo" IS NULL) OR
 ("origen" = 'ARRENDADO' AND "costoArriendo" IS NOT NULL AND "costoArriendo" >= 0 AND "unidadArriendo" IS NOT NULL AND "unidadArriendo" IN ('HORA','DIA','EVENTO')))
);
ALTER TABLE "Espacio" ADD CONSTRAINT "espacio_tarifa_valida" CHECK (
 ("costoArriendo" IS NULL AND "unidadArriendo" IS NULL) OR
 ("costoArriendo" IS NOT NULL AND "costoArriendo" >= 0 AND "unidadArriendo" IS NOT NULL AND "unidadArriendo" IN ('HORA','DIA','EVENTO'))
);
