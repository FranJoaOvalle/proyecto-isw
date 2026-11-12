const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

const ReservaService = require("./reserva.service");

class VehiculoService {
    async getAll(filtros = {}) {
        const vehiculos = await prisma.vehiculo.findMany({
            where: filtros.incluirRetirados ? {} : {
                habilitado: true,
                estado: { not: "RETIRADO" }
            },
            include: { _count: { select: { reservas: true } } },
            orderBy: [{ estado: "asc" }, { patente: "asc" }]
        });
        if (!filtros.inicio) return vehiculos.map(v => ({ ...v, disponible: null, reservado: null }));

        const reservas = await prisma.reservaVehiculo.findMany({
            where: {
                cancelada: false,
                vehiculoId: { in: vehiculos.map(v => v.id) },
                OR: [
                    { inicio: { lt: filtros.fin }, fin: { gt: filtros.inicio } },
                    { estadoDevolucion: "PENDIENTE", fin: { lte: new Date() } }
                ]
            },
            select: { vehiculoId: true }
        });
        const ocupados = new Set(reservas.map(r => r.vehiculoId));
        return vehiculos.map(v => ({
            ...v,
            reservado: ocupados.has(v.id),
            disponible: v.habilitado && v.estado === "DISPONIBLE" && !ocupados.has(v.id)
        }));
    }

    async getById(id, tx = prisma) {
        const vehiculo = await tx.vehiculo.findUnique({ where: { id: Number(id) } });
        if (!vehiculo) throw new NotFoundException("Vehículo no encontrado.");
        return vehiculo;
    }

    async create(data) {
        return prisma.vehiculo.create({ data: { ...data, patente: data.patente.toUpperCase() } });
    }

    async update(id, data) {
        return prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${Number(id)})::text`;
            await this.getById(id, tx);
            return tx.vehiculo.update({
                where: { id: Number(id) },
                data: {
                    ...data,
                    ...(data.patente
                        ? { patente: data.patente.toUpperCase() }
                        : {})
                }
            });
        });
    }

    async eliminar(id) {
        const vehiculoId = Number(id);
        await this.getById(vehiculoId);
        const reservas = await prisma.reservaVehiculo.count({ where: { vehiculoId } });
        if (reservas > 0) {
            throw new ConflictException(`No se puede eliminar definitivamente porque tiene ${reservas} ${reservas === 1 ? "reserva" : "reservas"} asociadas. Deshabilítalo para conservar el historial.`);
        }
        return prisma.vehiculo.delete({ where: { id: vehiculoId } });
    }

    async getReservas(id) {
        await this.getById(id);
        return prisma.reservaVehiculo.findMany({
            where: { vehiculoId: Number(id) },
            orderBy: { inicio: "asc" }
        });
    }

    async reservar(id, data) {
        const vehiculoId = Number(id);
        return prisma.$transaction(async tx => {
            const evento = await ReservaService.bloquearEvento(tx, data.eventoId);
            if (evento && evento.inicio <= new Date()) {
                throw new ConflictException("Las nuevas asignaciones del evento deben registrarse antes de su inicio.");
            }
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${vehiculoId})::text`;
            const vehiculo = await this.getById(vehiculoId, tx);
            if (!vehiculo.habilitado || vehiculo.estado !== "DISPONIBLE") {
                throw new ConflictException("El vehículo no está disponible para nuevas reservas.");
            }
            const conflicto = await tx.reservaVehiculo.findFirst({
                where: {
                    vehiculoId,
                    cancelada: false,
                    OR: [
                        { inicio: { lt: data.fin }, fin: { gt: data.inicio } },
                        { estadoDevolucion: "PENDIENTE", fin: { lte: new Date() } }
                    ]
                },
                select: { id: true }
            });
            if (conflicto) {
                throw new ConflictException("El vehículo ya está reservado o pendiente de devolución en ese período.");
            }
            return tx.reservaVehiculo.create({ data: { ...data, vehiculoId } });
        });
    }

    async cancelarReserva(id) {
        return prisma.$transaction(async tx => {
            let reserva = await tx.reservaVehiculo.findUnique({ where: { id: Number(id) } });
            if (!reserva) throw new NotFoundException("Reserva de vehículo no encontrada.");
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${reserva.vehiculoId})::text`;
            reserva = await tx.reservaVehiculo.findUnique({ where: { id: Number(id) } });
            if (reserva.inicio <= new Date()) throw new ConflictException("Registra la devolución para liberar un vehículo cuya reserva ya comenzó.");
            if (reserva.cancelada) throw new ConflictException("La reserva ya está cancelada.");
            if (reserva.estadoDevolucion !== "PENDIENTE") {
                throw new ConflictException("No se puede cancelar una reserva cuya devolución ya fue registrada.");
            }
            return tx.reservaVehiculo.update({
                where: { id: Number(id) },
                data: { cancelada: true }
            });
        });
    }

    async registrarDevolucion(id, reservaId, data) {
        return prisma.$transaction(async tx => {
            let reserva = await tx.reservaVehiculo.findUnique({ where: { id: Number(reservaId) } });
            if (!reserva || reserva.vehiculoId !== Number(id)) {
                throw new NotFoundException("Reserva de vehículo no encontrada.");
            }
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${reserva.vehiculoId})::text`;
            reserva = await tx.reservaVehiculo.findUnique({ where: { id: Number(reservaId) } });
            if (reserva.inicio > new Date()) throw new ConflictException("La reserva aún no ha comenzado.");
            if (reserva.cancelada || reserva.estadoDevolucion !== "PENDIENTE") {
                throw new ConflictException("La devolución ya fue registrada o la reserva fue cancelada.");
            }
            const estado = data.estadoDevolucion === "CON_OBSERVACIONES"
                ? "CON_OBSERVACIONES"
                : "CONFORME";
            const actualizado = await tx.reservaVehiculo.update({
                where: { id: reserva.id },
                data: {
                    estadoDevolucion: estado,
                    observacionesDevolucion: data.observacionesDevolucion ?? null
                }
            });
            if (estado === "CON_OBSERVACIONES") {
                await tx.vehiculo.update({
                    where: { id: reserva.vehiculoId },
                    data: { estado: "EN_MANTENCION" }
                });
            }
            return actualizado;
        });
    }
}

module.exports = new VehiculoService();
