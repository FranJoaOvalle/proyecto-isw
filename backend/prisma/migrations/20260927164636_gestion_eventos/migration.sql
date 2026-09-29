-- CreateTable
CREATE TABLE "eventos" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipoEvento" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horario" TEXT NOT NULL,
    "cantidadAsistentes" INTEGER NOT NULL,
    "lugar" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ORGANIZACION',
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_personal" (
    "eventoId" INTEGER NOT NULL,
    "personalId" INTEGER NOT NULL,
    "rolAsignado" TEXT,

    CONSTRAINT "evento_personal_pkey" PRIMARY KEY ("eventoId","personalId")
);

-- CreateTable
CREATE TABLE "evento_recursos" (
    "eventoId" INTEGER NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "evento_recursos_pkey" PRIMARY KEY ("eventoId","recursoId")
);

-- CreateTable
CREATE TABLE "evento_servicios" (
    "eventoId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION,

    CONSTRAINT "evento_servicios_pkey" PRIMARY KEY ("eventoId","servicioId")
);

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_personal" ADD CONSTRAINT "evento_personal_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_personal" ADD CONSTRAINT "evento_personal_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "Personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_recursos" ADD CONSTRAINT "evento_recursos_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_recursos" ADD CONSTRAINT "evento_recursos_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recurso"("id_recurso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_servicios" ADD CONSTRAINT "evento_servicios_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_servicios" ADD CONSTRAINT "evento_servicios_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicio"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;
