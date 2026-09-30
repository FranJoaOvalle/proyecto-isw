CREATE TABLE "presupuestos" (
 "id" SERIAL PRIMARY KEY, "clienteId" INTEGER NOT NULL, "eventoId" INTEGER NOT NULL,
 "espacioId" INTEGER, "descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
 "subtotal" DECIMAL(14,2) NOT NULL, "totalEstimado" DECIMAL(14,2) NOT NULL,
 "estado" VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE', "observaciones" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "presupuestos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "presupuestos_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "presupuestos_espacioId_fkey" FOREIGN KEY ("espacioId") REFERENCES "Espacio"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 CONSTRAINT "presupuestos_montos_validos" CHECK ("subtotal" >= 0 AND "descuento" >= 0 AND "descuento" <= "subtotal" AND "totalEstimado" = "subtotal" - "descuento"),
 CONSTRAINT "presupuestos_estado_valido" CHECK ("estado" IN ('PENDIENTE','ACEPTADO','RECHAZADO','INACTIVO'))
);
CREATE UNIQUE INDEX "presupuestos_eventoId_key" ON "presupuestos"("eventoId");
CREATE TABLE "presupuesto_servicios" (
 "id" SERIAL PRIMARY KEY, "presupuestoId" INTEGER NOT NULL, "servicioId" INTEGER NOT NULL,
 "nombre" VARCHAR(100) NOT NULL, "cantidad" INTEGER NOT NULL,
 "precioUnitario" DECIMAL(14,2) NOT NULL, "subtotal" DECIMAL(14,2) NOT NULL,
 CONSTRAINT "presupuesto_servicios_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "presupuestos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "presupuesto_servicios_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicio"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "presupuesto_servicios_montos_validos" CHECK ("cantidad" > 0 AND "precioUnitario" >= 0 AND "subtotal" = "cantidad" * "precioUnitario")
);
CREATE UNIQUE INDEX "presupuesto_servicios_presupuestoId_servicioId_key" ON "presupuesto_servicios"("presupuestoId", "servicioId");
