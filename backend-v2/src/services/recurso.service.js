const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const ValidationException = require("../exceptions/ValidationException");

const ReservaService = require("./reserva.service");
const ContratacionRecursosService = require("./contratacionRecursos.service");

const incluirDetalle = { material: true, humano: true };

class RecursoService {
    async getCotizables() {
        return prisma.recurso.findMany({
            where: { activo: true },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                tipo: true,
                precioUnitario: true,
                activo: true
            },
            orderBy: { nombre: "asc" }
        });
    }

    async getAll(incluirInactivos = false, intervalo = null) {
        const recursos = await prisma.recurso.findMany({
            where: {
                tipo: "MATERIAL",
                ...(incluirInactivos ? {} : { activo: true })
            },
            include: { ...incluirDetalle, _count: { select: { reservas: true, eventos: true, presupuestos: true } } },
            orderBy: { nombre: "asc" }
        });

        return Promise.all(recursos.map(async recurso => ({
            ...recurso,
            cantidadDisponible: intervalo
                ? (await ContratacionRecursosService.disponible(prisma, recurso, intervalo.inicio, intervalo.fin)).disponible
                : Math.max(0, recurso.stockTotal - recurso.cantidadEnMantencion - recurso.cantidadPerdida)
        })));
    }

    async getById(id, tx = prisma) {
        const recurso = await tx.recurso.findUnique({
            where: { id: Number(id), tipo: "MATERIAL" },
            include: incluirDetalle
        });

        if (!recurso) throw new NotFoundException("Recurso no encontrado.");
        return recurso;
    }

    async create(data) {
        const { unidad, ...camposBase } = data;
        return prisma.recurso.create({
            data: {
                ...camposBase,
                tipo: "MATERIAL",
                material: { create: { unidad: unidad ?? null } }
            },
            include: incluirDetalle
        });
    }

    async update(id, data) {
        return prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${Number(id)})::text`;
            const actual = await this.getById(id, tx);
            const cantidadEnMantencion =
                data.cantidadEnMantencion ?? actual.cantidadEnMantencion;
            const cantidadPerdida =
                data.cantidadPerdida ?? actual.cantidadPerdida;
            const stockTotal = data.stockTotal ?? actual.stockTotal;
            if (cantidadEnMantencion + cantidadPerdida > stockTotal) {
                throw new ValidationException(
                    "Las cantidades en mantención y perdidas no pueden superar el stock total."
                );
            }

            const ahora = new Date();
            const capacidad = await ContratacionRecursosService.disponible(tx, actual, ahora, new Date("9999-12-31"));
            if (
                stockTotal - cantidadEnMantencion - cantidadPerdida <
                capacidad.ocupado
            ) {
                throw new ConflictException(
                    "El stock operativo no puede ser menor a las reservas comprometidas."
                );
            }
            const { unidad, ...camposBase } = data;
            const detalle =
                unidad !== undefined
                    ? {
                          material: {
                              upsert: { create: { unidad }, update: { unidad } }
                          }
                      }
                    : {};

            return tx.recurso.update({
                where: { id: Number(id) },
                data: { ...camposBase, ...detalle },
                include: incluirDetalle
            });
        });
    }

    async cambiarEstado(id, activo) {
        return prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${Number(id)})::text`;
            const recurso = await this.getById(id, tx);
            if (recurso.activo === activo) {
                throw new ConflictException(
                    activo
                        ? "El recurso ya está activo."
                        : "El recurso ya está inactivo."
                );
            }

            return tx.recurso.update({
                where: { id: Number(id) },
                data: { activo },
                include: incluirDetalle
            });
        });
    }

    async eliminar(id) {
        const recursoId = Number(id);
        await this.getById(recursoId);
        const [reservas, eventos, presupuestos] = await Promise.all([
            prisma.reservaRecurso.count({ where: { recursoId } }),
            prisma.eventoRecurso.count({ where: { recursoId } }),
            prisma.presupuestoRecurso.count({ where: { recursoId } })
        ]);
        const relaciones = [
            reservas > 0 && `${reservas} ${reservas === 1 ? "reserva" : "reservas"}`,
            eventos > 0 && `${eventos} ${eventos === 1 ? "evento" : "eventos"}`,
            presupuestos > 0 && `${presupuestos} ${presupuestos === 1 ? "presupuesto" : "presupuestos"}`
        ].filter(Boolean);
        if (relaciones.length) {
            throw new ConflictException(`No se puede eliminar definitivamente porque tiene ${relaciones.join(", ")} asociados. Desactívalo para conservar el historial.`);
        }
        return prisma.$transaction(async tx => {
            await tx.recursoMaterial.deleteMany({ where: { recursoId } });
            return tx.recurso.delete({ where: { id: recursoId } });
        });
    }

    async getReservas(id) {
        await this.getById(id);
        return prisma.reservaRecurso.findMany({
            where: { recursoId: Number(id) },
            orderBy: { inicio: "asc" }
        });
    }

    async reservar(id, data) {
        const recursoId = Number(id);
        return prisma.$transaction(async tx => {
            const evento = await ReservaService.bloquearEvento(tx, data.eventoId);
            if (evento && evento.inicio <= new Date()) {
                throw new ConflictException("Las nuevas asignaciones del evento deben registrarse antes de su inicio.");
            }
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${recursoId})::text`;
            const recurso = await tx.recurso.findUnique({ where: { id: recursoId } });
            if (!recurso || recurso.tipo !== "MATERIAL") {
                throw new NotFoundException("Recurso material no encontrado.");
            }
            if (!recurso.activo) {
                throw new ConflictException("El recurso está inactivo y no admite reservas.");
            }
            if (evento?.solicitudId && await tx.eventoRecurso.findFirst({
                where: { eventoId: evento.id, recursoId }
            })) {
                throw new ConflictException("Este equipo ya forma parte de la propuesta contratada. Revisa el acuerdo antes de cambiar su cantidad.");
            }

            await ContratacionRecursosService.validarReserva(tx, recurso, data);

            return tx.reservaRecurso.create({
                data: { ...data, recursoId }
            });
        });
    }

    async cancelarReserva(id) {
        return prisma.$transaction(async tx => {
            let reserva = await tx.reservaRecurso.findUnique({ where: { id: Number(id) } });
            if (!reserva) throw new NotFoundException("Reserva de recurso no encontrada.");
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${reserva.recursoId})::text`;
            reserva = await tx.reservaRecurso.findUnique({ where: { id: Number(id) } });
            if (reserva.inicio <= new Date()) throw new ConflictException("Registra la devolución para liberar un equipo cuya reserva ya comenzó.");
            if (reserva.cancelada) {
                throw new ConflictException("La reserva ya está cancelada.");
            }
            if (reserva.eventoId != null && reserva.referencia === `Contrato evento #${reserva.eventoId}`) {
                throw new ConflictException("Esta reserva pertenece a la propuesta contratada. Cancela el evento o revisa el acuerdo comercial.");
            }
            if (reserva.estadoDevolucion !== "PENDIENTE") {
                throw new ConflictException("No se puede cancelar una reserva cuya devolución ya fue registrada.");
            }
            return tx.reservaRecurso.update({
                where: { id: Number(id) },
                data: { cancelada: true }
            });
        });
    }

    async registrarDevolucion(id, reservaId, data) {
        return prisma.$transaction(async tx => {
            let reserva = await tx.reservaRecurso.findUnique({ where: { id: Number(reservaId) } });
            if (!reserva || reserva.recursoId !== Number(id)) {
                throw new NotFoundException("Reserva de recurso no encontrada.");
            }
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${reserva.recursoId})::text`;
            reserva = await tx.reservaRecurso.findUnique({ where: { id: Number(reservaId) } });
            if (reserva.inicio > new Date()) throw new ConflictException("La reserva aún no ha comenzado.");
            if (reserva.cancelada || reserva.estadoDevolucion !== "PENDIENTE") {
                throw new ConflictException("La devolución ya fue registrada o la reserva fue cancelada.");
            }
            if (data.cantidadDanada + data.cantidadPerdida > reserva.cantidad) {
                throw new ValidationException(
                    "Las unidades dañadas y perdidas no pueden superar la cantidad reservada."
                );
            }

            const recurso = await tx.recurso.findUnique({ where: { id: reserva.recursoId } });
            const nuevoMantenimiento = recurso.cantidadEnMantencion + data.cantidadDanada;
            const nuevasPerdidas = recurso.cantidadPerdida + data.cantidadPerdida;
            if (nuevoMantenimiento + nuevasPerdidas > recurso.stockTotal) {
                throw new ConflictException("La devolución supera el stock registrado del recurso.");
            }

            await tx.recurso.update({
                where: { id: recurso.id },
                data: {
                    cantidadEnMantencion: nuevoMantenimiento,
                    cantidadPerdida: nuevasPerdidas
                }
            });
            return tx.reservaRecurso.update({
                where: { id: reserva.id },
                data: {
                    estadoDevolucion: data.cantidadDanada || data.cantidadPerdida
                        ? "CON_OBSERVACIONES"
                        : "CONFORME",
                    cantidadDanada: data.cantidadDanada,
                    cantidadPerdida: data.cantidadPerdida,
                    observacionesDevolucion: data.observacionesDevolucion ?? null
                }
            });
        });
    }
}

module.exports = new RecursoService();
