-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'PRODUCTOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('PERSONA', 'EMPRESA');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('HUMANO', 'MATERIAL');

-- CreateEnum
CREATE TYPE "OrigenRecursoHumano" AS ENUM ('INTERNO', 'EXTERNO');

-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('CONFIRMADO', 'POSPUESTO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('ANTICIPO', 'SALDO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "EstadoPresupuesto" AS ENUM ('BORRADOR', 'PENDIENTE_PAGO', 'ACEPTADO', 'CANCELADO', 'VENCIDO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" "TipoCliente" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientePersona" (
    "clienteId" INTEGER NOT NULL,
    "rut" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "telefono" TEXT,

    CONSTRAINT "ClientePersona_pkey" PRIMARY KEY ("clienteId")
);

-- CreateTable
CREATE TABLE "ClienteEmpresa" (
    "clienteId" INTEGER NOT NULL,
    "rutEmpresa" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "casaMatriz" TEXT NOT NULL,
    "telefono" TEXT,

    CONSTRAINT "ClienteEmpresa_pkey" PRIMARY KEY ("clienteId")
);

-- CreateTable
CREATE TABLE "Productor" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "telefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Productor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoEvento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioBase" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoRecurso" NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,
    "stockTotal" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecursoMaterial" (
    "recursoId" INTEGER NOT NULL,
    "unidad" TEXT,

    CONSTRAINT "RecursoMaterial_pkey" PRIMARY KEY ("recursoId")
);

-- CreateTable
CREATE TABLE "RecursoHumano" (
    "recursoId" INTEGER NOT NULL,
    "origen" "OrigenRecursoHumano" NOT NULL,

    CONSTRAINT "RecursoHumano_pkey" PRIMARY KEY ("recursoId")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "productorId" INTEGER NOT NULL,
    "tipoEventoId" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT NOT NULL,
    "asistentes" INTEGER NOT NULL,
    "estado" "EstadoEvento" NOT NULL DEFAULT 'CONFIRMADO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "presupuestoId" INTEGER NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoRecurso" (
    "eventoId" INTEGER NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "EventoRecurso_pkey" PRIMARY KEY ("eventoId","recursoId")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipoEventoId" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT NOT NULL,
    "asistentes" INTEGER NOT NULL,
    "venceAt" TIMESTAMP(3),
    "nombreTipoEvento" TEXT NOT NULL,
    "precioBaseTipoEvento" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "recargoCliente" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "porcentajeAnticipo" DECIMAL(5,2) NOT NULL,
    "montoAnticipo" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoPresupuesto" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresupuestoRecurso" (
    "presupuestoId" INTEGER NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "nombreRecurso" TEXT NOT NULL,
    "tipoRecurso" "TipoRecurso" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PresupuestoRecurso_pkey" PRIMARY KEY ("presupuestoId","recursoId")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "presupuestoId" INTEGER NOT NULL,
    "tipo" "TipoPago" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" TIMESTAMP(3),
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calificacion" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoCambio" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_usuarioId_key" ON "Cliente"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientePersona_rut_key" ON "ClientePersona"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteEmpresa_rutEmpresa_key" ON "ClienteEmpresa"("rutEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Productor_usuarioId_key" ON "Productor"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoEvento_nombre_key" ON "TipoEvento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Recurso_nombre_tipo_key" ON "Recurso"("nombre", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Evento_presupuestoId_key" ON "Evento"("presupuestoId");

-- CreateIndex
CREATE INDEX "Evento_clienteId_idx" ON "Evento"("clienteId");

-- CreateIndex
CREATE INDEX "Evento_productorId_idx" ON "Evento"("productorId");

-- CreateIndex
CREATE INDEX "Evento_tipoEventoId_idx" ON "Evento"("tipoEventoId");

-- CreateIndex
CREATE INDEX "Evento_inicio_fin_idx" ON "Evento"("inicio", "fin");

-- CreateIndex
CREATE INDEX "EventoRecurso_recursoId_idx" ON "EventoRecurso"("recursoId");

-- CreateIndex
CREATE INDEX "Presupuesto_clienteId_idx" ON "Presupuesto"("clienteId");

-- CreateIndex
CREATE INDEX "Presupuesto_tipoEventoId_idx" ON "Presupuesto"("tipoEventoId");

-- CreateIndex
CREATE INDEX "PresupuestoRecurso_recursoId_idx" ON "PresupuestoRecurso"("recursoId");

-- CreateIndex
CREATE INDEX "Pago_presupuestoId_idx" ON "Pago"("presupuestoId");

-- CreateIndex
CREATE UNIQUE INDEX "Calificacion_eventoId_key" ON "Calificacion"("eventoId");

-- CreateIndex
CREATE INDEX "EventoCambio_eventoId_idx" ON "EventoCambio"("eventoId");

-- CreateIndex
CREATE INDEX "EventoCambio_usuarioId_idx" ON "EventoCambio"("usuarioId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientePersona" ADD CONSTRAINT "ClientePersona_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteEmpresa" ADD CONSTRAINT "ClienteEmpresa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Productor" ADD CONSTRAINT "Productor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoMaterial" ADD CONSTRAINT "RecursoMaterial_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoHumano" ADD CONSTRAINT "RecursoHumano_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_tipoEventoId_fkey" FOREIGN KEY ("tipoEventoId") REFERENCES "TipoEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoRecurso" ADD CONSTRAINT "EventoRecurso_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoRecurso" ADD CONSTRAINT "EventoRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_tipoEventoId_fkey" FOREIGN KEY ("tipoEventoId") REFERENCES "TipoEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresupuestoRecurso" ADD CONSTRAINT "PresupuestoRecurso_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresupuestoRecurso" ADD CONSTRAINT "PresupuestoRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCambio" ADD CONSTRAINT "EventoCambio_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCambio" ADD CONSTRAINT "EventoCambio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
