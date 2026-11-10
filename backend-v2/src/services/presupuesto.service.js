const prisma = require("../config/prisma");
const { Prisma } = require("../../generated/prisma/client");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const ValidationException = require("../exceptions/ValidationException");
const SolicitudService = require("./solicitud.service");
const IntegracionPresupuestosService = require("./integracionPresupuestos.service");

const include = {
    cliente: true,
    tipoEvento: true,
    solicitud: true,
    recursos: { include: { recurso: true } }
};
const dinero = (value) => new Prisma.Decimal(value).toDecimalPlaces(2);
const LIMITE_MONTO = new Prisma.Decimal("9999999999.99");

class PresupuestoService {
    async getAll() {
        return prisma.presupuesto.findMany({
            include,
            orderBy: { id: "desc" }
        });
    }

    async getById(id, tx = prisma) {
        const presupuesto = await tx.presupuesto.findUnique({
            where: { id: Number(id) },
            include
        });
        if (!presupuesto) throw new NotFoundException("Presupuesto no encontrado.");
        return presupuesto;
    }

    async bloquear(tx, id) {
        await tx.$queryRaw`SELECT "id" FROM "Presupuesto" WHERE "id" = ${Number(id)} FOR UPDATE`;
        const presupuesto = await this.getById(id, tx);
        if (presupuesto.estado !== "BORRADOR") {
            throw new ConflictException(
                "Solo se puede modificar un presupuesto que todavía está en borrador."
            );
        }
        return presupuesto;
    }

    async calcular(tx, datos, solicitud, actual = null) {
        const cliente = await tx.cliente.findUnique({
            where: { id: solicitud.clienteId },
            include: { usuario: true }
        });
        if (!cliente) {
            throw new NotFoundException("El cliente asociado a la solicitud no existe.");
        }
        if (!cliente.usuario?.activo) {
            throw new ValidationException("El cliente asociado está inactivo y no puede recibir propuestas.");
        }

        const inicio = new Date(datos.inicio);
        const fin = new Date(datos.fin);
        if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime()) || fin <= inicio) {
            throw new ValidationException("El término debe ser posterior al inicio del evento.");
        }
        if (inicio <= new Date()) {
            throw new ValidationException("La fecha de inicio debe ser futura.");
        }

        await tx.$queryRaw`SELECT "id" FROM "TipoEvento" WHERE "id" = ${solicitud.tipoEventoId} FOR SHARE`;
        const tipoEvento = await tx.tipoEvento.findUnique({
            where: { id: solicitud.tipoEventoId }
        });
        if (!tipoEvento?.activo) {
            throw new ConflictException("El tipo de evento de la solicitud no está vigente.");
        }
        if (datos.asistentes < tipoEvento.cantidadPersonasBase) {
            throw new ValidationException(
                `La cantidad mínima de asistentes es ${tipoEvento.cantidadPersonasBase}.`
            );
        }

        let precioBase;
        if (tipoEvento.modalidadPrecio === "FIJO") {
            if (tipoEvento.precioBase == null) {
                throw new ConflictException("El tipo de evento no tiene un precio base configurado.");
            }
            precioBase = dinero(tipoEvento.precioBase);
        } else if (tipoEvento.modalidadPrecio === "POR_HORA") {
            if (tipoEvento.tarifaHora == null) {
                throw new ConflictException("El tipo de evento no tiene una tarifa por hora configurada.");
            }
            const milisegundos = fin.getTime() - inicio.getTime();
            const horas = new Prisma.Decimal(milisegundos).div(3600000);
            precioBase = dinero(new Prisma.Decimal(tipoEvento.tarifaHora).mul(horas));
        } else {
            throw new ConflictException("El tipo de evento tiene una modalidad de precio no válida.");
        }
        if (precioBase.lt(0) || precioBase.gt(LIMITE_MONTO)) {
            throw new ValidationException("El precio base calculado está fuera del límite permitido.");
        }

        const recursosSolicitados = datos.recursos ?? [];
        const idsRecursos = recursosSolicitados.map(({ recursoId }) => recursoId);
        if (new Set(idsRecursos).size !== idsRecursos.length) {
            throw new ValidationException("No se permiten recursos duplicados en el presupuesto.");
        }
        const catalogo = await tx.recurso.findMany({
            where: { id: { in: idsRecursos } }
        });
        const recursosSnapshot = recursosSolicitados.map((item) => {
            const recurso = catalogo.find(({ id }) => id === item.recursoId);
            if (!recurso?.activo) {
                throw new ValidationException(
                    `El recurso ${item.recursoId} no existe o está inactivo.`
                );
            }
            const precioUnitario = dinero(recurso.precioUnitario);
            return {
                recursoId: recurso.id,
                nombreRecurso: recurso.nombre,
                tipoRecurso: recurso.tipo,
                cantidad: item.cantidad,
                precioUnitario,
                subtotal: dinero(precioUnitario.mul(item.cantidad))
            };
        });

        const subtotalRecursos = recursosSnapshot.reduce(
            (acumulado, item) => acumulado.plus(item.subtotal),
            dinero(0)
        );
        const subtotal = dinero(precioBase.plus(subtotalRecursos));
        const descuento = dinero(datos.descuento ?? actual?.descuento ?? 0);
        if (descuento.gt(subtotal)) {
            throw new ValidationException("El descuento no puede superar el subtotal.");
        }
        const recargoCliente = dinero(actual?.recargoCliente ?? 0);
        const total = dinero(subtotal.minus(descuento).plus(recargoCliente));
        if (subtotal.gt(LIMITE_MONTO) || total.gt(LIMITE_MONTO)) {
            throw new ValidationException("El monto supera el máximo permitido.");
        }
        const porcentajeAnticipo = dinero(30);

        return {
            clienteId: solicitud.clienteId,
            tipoEventoId: solicitud.tipoEventoId,
            inicio,
            fin,
            lugar: datos.lugar,
            asistentes: datos.asistentes,
            nombreTipoEvento: tipoEvento.nombre,
            // En modalidad por hora se guarda el importe calculado para esta propuesta.
            precioBaseTipoEvento: precioBase,
            subtotal,
            descuento,
            recargoCliente,
            total,
            porcentajeAnticipo,
            montoAnticipo: dinero(total.mul(porcentajeAnticipo).div(100)),
            estado: actual?.estado ?? "BORRADOR",
            recursos: { create: recursosSnapshot }
        };
    }

    async create(datos, actorId) {
        if (!Number.isInteger(actorId)) {
            throw new ValidationException("Se requiere el identificador del administrador autenticado.");
        }
        return prisma.$transaction(async (tx) => {
            // Valida ADMIN activo, solicitud EN_REVISION y bloquea la fila hasta commit.
            const solicitud = await SolicitudService.validarEmision({
                tx,
                solicitudId: datos.solicitudId,
                actorId
            });
            const valores = await this.calcular(tx, datos, solicitud);
            return tx.presupuesto.create({
                data: { ...valores, solicitudId: solicitud.id },
                include
            });
        });
    }

    async update(id, datos, actorId) {
        return prisma.$transaction(async (tx) => {
            const actual = await this.bloquear(tx, id);
            if (actual.solicitudId !== null) {
                await IntegracionPresupuestosService.verificarEdicionSolicitud({
                    tx,
                    solicitudId: actual.solicitudId,
                    actorId,
                    cambios: datos
                });
            }
            const solicitud = actual.solicitud ?? {
                clienteId: actual.clienteId,
                tipoEventoId: actual.tipoEventoId
            };
            const recursos = datos.recursos ?? actual.recursos.map(({ recursoId, cantidad }) => ({ recursoId, cantidad }));
            const valores = await this.calcular(
                tx,
                { ...actual, ...datos, recursos },
                solicitud,
                actual
            );
            await tx.presupuestoRecurso.deleteMany({
                where: { presupuestoId: Number(id) }
            });
            return tx.presupuesto.update({
                where: { id: Number(id) },
                data: valores,
                include
            });
        });
    }

    async cancelar(id) {
        return prisma.$transaction(async (tx) => {
            const actual = await this.bloquear(tx, id);
            return tx.presupuesto.update({
                where: { id: actual.id },
                data: { estado: "CANCELADO" },
                include
            });
        });
    }
}

module.exports = new PresupuestoService();
