ALTER TABLE "Presupuesto"
    ADD COLUMN "precioBaseCatalogo" DECIMAL(12,2),
    ADD COLUMN "precioBaseAcordado" DECIMAL(12,2),
    ADD COLUMN "costoArriendoEspacio" DECIMAL(12,2),
    ADD COLUMN "unidadArriendoEspacio" "UnidadArriendo",
    ADD COLUMN "subtotalArriendoEspacio" DECIMAL(12,2),
    ADD COLUMN "arriendoIncluido" BOOLEAN;
